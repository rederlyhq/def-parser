// const ASSIGNMENT_TYPE_REGEX = /^assignmentType\\s*/;
const ASSIGNMENT_TYPE_REGEX = /^assignmentType\s*=\s*(.*)?\s*/;
export default class WebWorkDef {
    public assignmentType:string;

    constructor(content:string) {
        const lines = content.split('\n');
        lines.forEach((line) => {
            let match;
            if(match = line.match(ASSIGNMENT_TYPE_REGEX)) {
                this.assignmentType = match[1];
            } else {
                console.error(`Failed to parse the following line: ${line}`);
            }
        });
    }
}