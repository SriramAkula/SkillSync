import xml.etree.ElementTree as ET
import sys

def parse_jacoco():
    tree = ET.parse('c:\\Users\\srira\\Desktop\\SkillSync-Project\\backend\\user-service\\target\\site\\jacoco\\jacoco.xml')
    root = tree.getroot()
    for package in root.findall('package'):
        for class_node in package.findall('class'):
            class_name = class_node.get('name')
            # Look up sourcefile
            source_file = class_node.get('sourcefilename')
            if not source_file:
                continue
            
            # Find the corresponding sourcefile node in the same package
            for sf_node in package.findall('sourcefile'):
                if sf_node.get('name') == source_file:
                    for line_node in sf_node.findall('line'):
                        mb = int(line_node.get('mb', 0))
                        cb = int(line_node.get('cb', 0))
                        if mb > 0:
                            print(f"{class_name} (Line {line_node.get('nr')}): Missed branches: {mb}, Covered branches: {cb}")

if __name__ == "__main__":
    parse_jacoco()
