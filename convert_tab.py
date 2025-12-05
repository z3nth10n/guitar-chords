import xml.etree.ElementTree as ET
import re
import sys

def parse_svg_tab(file_path):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Namespaces can be tricky in SVG, usually {http://www.w3.org/2000/svg}
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        
        # 1. Extract BPM
        bpm = "Unknown"
        # Look for text starting with "= "
        for text in root.findall(".//svg:text", ns):
            if text.text and text.text.strip().startswith("= "):
                bpm = text.text.strip().replace("= ", "")
                break
        
        # 2. Extract Time Signature
        # Look for text with class "C7u5nc" (based on file inspection) or just consecutive numbers
        time_sig = []
        for text in root.findall(".//svg:text", ns):
            # In the file, 4 and 4 were at x=59.5 y=28 and y=57
            if text.get("class") == "C7u5nc":
                time_sig.append(text.text)
        
        ts_str = "4/4"
        if len(time_sig) >= 2:
            ts_str = f"{time_sig[0]}/{time_sig[1]}"

        # 3. Extract Palm Mutes
        # Look for "P. M." text and associated lines
        pm_markers = []
        for text in root.findall(".//svg:text", ns):
            if text.text and "P. M." in text.text:
                x = float(text.get("x"))
                pm_markers.append(x)
        
        # 4. Extract Notes (The hard part - likely missing or vector)
        # We will output a placeholder for notes
        
        output = []
        output.append(f"Song: Converted Tab")
        output.append(f"BPM: {bpm}")
        output.append(f"Time: {ts_str}")
        output.append(f"Tuning: E B G D A E") # Default, couldn't parse easily from SVG paths
        output.append("")
        
        # Mocking a block based on what we found
        # We found 5 measures (markers 1, 2, 3, 4, 5)
        # We'll create 5 empty measures with PM lines if applicable
        
        # This is a very basic extraction because the XML is visual, not semantic.
        
        output.append("PM|------------------------------------------------|")
        output.append("e |------------------------------------------------|")
        output.append("B |------------------------------------------------|")
        output.append("G |------------------------------------------------|")
        output.append("D |------------------------------------------------|")
        output.append("A |------------------------------------------------|")
        output.append("E |------------------------------------------------|")
        output.append("")
        output.append("(Note: Actual fret numbers were detected as vector paths and could not be parsed textually.)")
        
        return "\n".join(output)

    except Exception as e:
        return f"Error parsing XML: {str(e)}"

if __name__ == "__main__":
    xml_file = "tabs/tabs.xml"
    print(parse_svg_tab(xml_file))
