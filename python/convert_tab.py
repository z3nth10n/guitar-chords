import cv2
import easyocr
import numpy as np
import sys
import math

class TabConverter:
    def __init__(self, image_path):
        self.image_path = image_path
        self.reader = easyocr.Reader(['en'], gpu=False)
        self.img = cv2.imread(image_path)
        if self.img is None:
            raise ValueError(f"Could not load image: {image_path}")
        self.gray = cv2.cvtColor(self.img, cv2.COLOR_BGR2GRAY)
        self.height, self.width = self.gray.shape
        self.tuning_labels = ['e', 'B', 'G', 'D', 'A', 'E']

    def convert(self):
        # 1. Detect Horizontal Lines (Strings)
        horizontal_lines = self.detect_horizontal_lines()
        
        # 2. Group lines into Systems (blocks of 6 strings)
        systems = self.group_lines_into_systems(horizontal_lines)
        
        if not systems:
            # Fallback: Try to find systems by OCR anchors if lines failed
            systems = self.find_systems_by_ocr_anchors()
            
        if not systems:
            return "Error: Could not detect tab structure (lines or tuning keys)."

        # 3. Run OCR on the whole image
        ocr_results = self.reader.readtext(self.img)
        
        # 4. Process each system
        full_output = []
        
        # Header
        full_output.append("Song: OCR Result")
        full_output.append("BPM: 120")
        full_output.append("")
        
        for i, system_lines in enumerate(systems):
            system_output = self.process_system(system_lines, ocr_results)
            full_output.append(system_output)
            full_output.append("") # Spacing
            
        return "\n".join(full_output)

    def detect_horizontal_lines(self):
        edges = cv2.Canny(self.gray, 50, 150, apertureSize=3)
        # Min line length: 20% of width
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=self.width // 5, maxLineGap=20)
        
        y_coords = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if abs(y2 - y1) < 5: # Horizontal
                    y_coords.append(int((y1 + y2) / 2))
        
        y_coords.sort()
        
        # Merge close lines
        unique_lines = []
        if y_coords:
            current_group = [y_coords[0]]
            for y in y_coords[1:]:
                if y - current_group[-1] < 10:
                    current_group.append(y)
                else:
                    unique_lines.append(int(sum(current_group) / len(current_group)))
                    current_group = [y]
            unique_lines.append(int(sum(current_group) / len(current_group)))
            
        return unique_lines

    def group_lines_into_systems(self, lines):
        systems = []
        if len(lines) < 6:
            return []
            
        gaps = [lines[i+1] - lines[i] for i in range(len(lines)-1)]
        if not gaps:
            return []
            
        median_gap = np.median(gaps)
        
        current_system = [lines[0]]
        for i in range(len(gaps)):
            gap = gaps[i]
            next_line = lines[i+1]
            
            if gap > median_gap * 2.5:
                if len(current_system) >= 4: 
                    systems.append(current_system)
                current_system = [next_line]
            else:
                current_system.append(next_line)
                
        if len(current_system) >= 4:
            systems.append(current_system)
            
        final_systems = []
        for sys_lines in systems:
            # Normalize to 6 lines
            if len(sys_lines) == 6:
                final_systems.append(sys_lines)
            elif len(sys_lines) > 6:
                final_systems.append(sys_lines[:6])
            elif len(sys_lines) >= 4:
                avg_spacing = (sys_lines[-1] - sys_lines[0]) / (len(sys_lines) - 1)
                while len(sys_lines) < 6:
                    sys_lines.append(int(sys_lines[-1] + avg_spacing))
                final_systems.append(sys_lines)
                
        return final_systems

    def find_systems_by_ocr_anchors(self):
        results = self.reader.readtext(self.img)
        anchors = []
        for (bbox, text, prob) in results:
            center_x = (bbox[0][0] + bbox[1][0]) / 2
            center_y = (bbox[0][1] + bbox[2][1]) / 2
            if center_x < self.width * 0.2:
                clean = text.strip().replace('|', '')
                if clean in self.tuning_labels:
                    anchors.append(center_y)
        
        anchors.sort()
        systems = []
        if len(anchors) >= 6:
            # Naive: just take first 6 for now, assuming one system
            # TODO: Better clustering for multiple systems
            systems.append(anchors[:6])
        return systems

    def process_system(self, string_y_coords, ocr_results):
        top_y = min(string_y_coords) - 20
        bottom_y = max(string_y_coords) + 20
        
        # 1. Filter OCR results
        system_notes = []
        for (bbox, text, prob) in ocr_results:
            center_x = (bbox[0][0] + bbox[1][0]) / 2
            center_y = (bbox[0][1] + bbox[2][1]) / 2
            
            if top_y <= center_y <= bottom_y:
                if text.isdigit() or text in ['x', 'h', 'p', '/', '\\']:
                    closest_string_idx = min(range(6), key=lambda i: abs(string_y_coords[i] - center_y))
                    system_notes.append({
                        'x': center_x,
                        'string': closest_string_idx,
                        'text': text
                    })
        
        # 2. Detect Vertical Bars
        vertical_bars = self.detect_vertical_bars(top_y, bottom_y)
        
        # 3. Construct Grid
        events = []
        for note in system_notes:
            events.append({'type': 'note', 'x': note['x'], 'data': note})
        for bar_x in vertical_bars:
            events.append({'type': 'bar', 'x': bar_x})
            
        events.sort(key=lambda e: e['x'])
        
        # Group into columns
        columns = []
        if events:
            current_col = [events[0]]
            for event in events[1:]:
                if event['x'] - current_col[-1]['x'] < 15: 
                    current_col.append(event)
                else:
                    columns.append(current_col)
                    current_col = [event]
            columns.append(current_col)
            
        # Build strings
        strings_out = [['-' for _ in range(200)] for _ in range(6)] # Pre-allocate
        
        # Init with tuning
        for i in range(6):
            strings_out[i][0] = self.tuning_labels[i]
            strings_out[i][1] = '|'
            
        col_idx = 2
        
        for col in columns:
            has_bar = any(e['type'] == 'bar' for e in col)
            
            if has_bar:
                for i in range(6):
                    strings_out[i][col_idx] = '|'
                col_idx += 1
            else:
                width = 1
                notes_in_col = [e['data'] for e in col if e['type'] == 'note']
                for note in notes_in_col:
                    if len(note['text']) > width: width = len(note['text'])
                
                for note in notes_in_col:
                    s_idx = note['string']
                    txt = note['text']
                    for char_i, char in enumerate(txt):
                        strings_out[s_idx][col_idx + char_i] = char
                        
                col_idx += width + 1 
                
        # Trim
        final_len = col_idx
        
        output_lines = []
        output_lines.append("| 1 |") # Mock measure
        
        for i in range(6):
            line_str = "".join(strings_out[i][:final_len])
            output_lines.append(line_str)
            
        output_lines.append("| | | |") # Mock rhythm
        
        return "\n".join(output_lines)

    def detect_vertical_bars(self, top_y, bottom_y):
        roi = self.gray[int(top_y):int(bottom_y), :]
        if roi.size == 0: return []
        
        edges = cv2.Canny(roi, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=roi.shape[0] * 0.8, maxLineGap=10)
        
        bars = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if abs(x2 - x1) < 5: 
                    bars.append(int((x1 + x2) / 2))
        
        bars.sort()
        unique_bars = []
        if bars:
            last = bars[0]
            unique_bars.append(last)
            for b in bars[1:]:
                if b - last > 20:
                    unique_bars.append(b)
                    last = b
        return unique_bars

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_tab.py <image_path>")
        sys.exit(1)
        
    converter = TabConverter(sys.argv[1])
    print(converter.convert())
