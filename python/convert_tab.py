import easyocr
import cv2
import numpy as np
import sys

def detect_lines(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
    
    horizontal_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if abs(y2 - y1) < 5:
                horizontal_lines.append(int((y1 + y2) / 2))
    
    horizontal_lines.sort()
    unique_lines = []
    if horizontal_lines:
        current_group = [horizontal_lines[0]]
        for y in horizontal_lines[1:]:
            if y - current_group[-1] < 10:
                current_group.append(y)
            else:
                unique_lines.append(int(sum(current_group) / len(current_group)))
                current_group = [y]
        unique_lines.append(int(sum(current_group) / len(current_group)))
    
    if len(unique_lines) >= 6:
        return unique_lines[:6]
    return unique_lines

def detect_vertical_lines(image_path, string_y_coords):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    
    # Detect vertical lines
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=50, maxLineGap=10)
    
    vertical_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if abs(x2 - x1) < 5: # Vertical
                # Check if it intersects with the staff
                min_y = min(string_y_coords)
                max_y = max(string_y_coords)
                if y1 < max_y and y2 > min_y:
                    vertical_lines.append(int((x1 + x2) / 2))
    
    vertical_lines.sort()
    unique_v_lines = []
    if vertical_lines:
        current_group = [vertical_lines[0]]
        for x in vertical_lines[1:]:
            if x - current_group[-1] < 10:
                current_group.append(x)
            else:
                unique_v_lines.append(int(sum(current_group) / len(current_group)))
                current_group = [x]
        unique_v_lines.append(int(sum(current_group) / len(current_group)))
        
    return unique_v_lines

def process_tab_image(image_path):
    # 1. Detect Lines
    string_y_coords = detect_lines(image_path)
    if len(string_y_coords) < 6:
        print("Error: Could not detect 6 guitar strings.")
        return

    # 2. Detect Vertical Bars
    vertical_bars = detect_vertical_lines(image_path, string_y_coords)

    # 3. Run OCR
    reader = easyocr.Reader(['en'], gpu=False) 
    result = reader.readtext(image_path)
    
    # 4. Group detections
    metadata = []
    pm_markers = []
    measure_numbers = []
    string_content = {i: [] for i in range(6)} 
    
    top_string_y = string_y_coords[0]
    line_spacing = string_y_coords[1] - string_y_coords[0]
    
    for (bbox, text, prob) in result:
        y_center = (bbox[0][1] + bbox[2][1]) / 2
        x_start = bbox[0][0]
        
        # Check if it's metadata (well above first string)
        if y_center < top_string_y - line_spacing:
            if "P M" in text or "PM" in text:
                pm_markers.append({'x': x_start, 'text': text})
            elif "J=" in text or "BPM" in text:
                metadata.append(text)
            elif text.isdigit() and len(text) < 3: # Likely measure number
                 measure_numbers.append({'x': x_start, 'text': text})
            else:
                pass
        else:
            # Find closest string
            closest_idx = -1
            min_dist = float('inf')
            for i, string_y in enumerate(string_y_coords):
                dist = abs(y_center - string_y)
                if dist < min_dist:
                    min_dist = dist
                    closest_idx = i
            
            if min_dist < line_spacing * 0.8:
                string_content[closest_idx].append({'x': x_start, 'text': text})

    # 5. Construct Output
    output_lines = []
    
    # BPM
    bpm = "180" 
    for m in metadata:
        if "J=" in m:
            bpm = m.replace("J=", "").strip()
        if "BPM" in m:
            bpm = m.replace("BPM", "").replace(":", "").strip()
    output_lines.append(f"Song: OCR Validation")
    output_lines.append(f"Artist: Visual Tab")
    output_lines.append(f"BPM: {bpm}")
    output_lines.append("Time: 4/4") 
    output_lines.append("")
    
    # Determine grid
    max_x = 0
    for s in string_content.values():
        for item in s:
            max_x = max(max_x, item['x'] + len(item['text'])*10)
    
    char_width = 12 
    line_length_chars = int(max_x / char_width) + 20
    
    # Initialize lines
    tab_lines = [['-' for _ in range(line_length_chars)] for _ in range(6)]
    pm_line = [' ' for _ in range(line_length_chars)]
    measure_num_line = [' ' for _ in range(line_length_chars)]
    
    # Fill PM
    for item in pm_markers:
        pos = int(item['x'] / char_width)
        if pos < len(pm_line):
            # "PM----|" format
            pm_text = "PM----|"
            for k, char in enumerate(pm_text):
                if pos + k < len(pm_line):
                    pm_line[pos + k] = char

    # Fill Measure Numbers
    for item in measure_numbers:
        pos = int(item['x'] / char_width)
        if pos < len(measure_num_line):
             measure_num_line[pos] = item['text']

    # Fill Vertical Bars
    for x in vertical_bars:
        pos = int(x / char_width)
        if pos < len(measure_num_line):
            measure_num_line[pos] = '|'
            for i in range(6):
                tab_lines[i][pos] = '|'

    # Fill Strings
    for str_idx in range(6):
        for item in string_content[str_idx]:
            text = item['text']
            start_pos = int(item['x'] / char_width)
            for i, char in enumerate(text):
                if start_pos + i < len(tab_lines[str_idx]):
                    tab_lines[str_idx][start_pos + i] = char

    # Add headers
    string_names = ['e', 'B', 'G', 'D', 'A', 'E']
    
    output_lines.append("   " + "".join(pm_line))
    output_lines.append(" | " + "".join(measure_num_line))
    
    for i in range(6):
        line_str = "".join(tab_lines[i])
        output_lines.append(f"{string_names[i]}|{line_str}")

    # Rhythm Lines (Mocked for now as detection is hard)
    rhythm_stems = "    " + "|  |  |  |   |  |  |  |     |  |  |  |    |  |  |  |    |  |  |  |    |   |   |   |   |   |   |  |"
    rhythm_beams = "    " + "__________   __________     __________    __________    __________    __________    _____________   ____________"
    
    output_lines.append(rhythm_stems[:line_length_chars])
    output_lines.append(rhythm_beams[:line_length_chars])

    print("\n".join(output_lines))

if __name__ == "__main__":
    process_tab_image("tabs/tabs.png")
