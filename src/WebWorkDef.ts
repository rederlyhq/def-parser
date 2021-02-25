import logger from './sharedLogger';

// TODO move to @rederly/typescript-utils
const isKeyOf = <T> (key: any, obj: T): key is keyof T => key in obj;

interface WebWorkDefKeyValueMapOptions {
    webWorkKey: string;
    resultKey?: string;
    comment?: string;
}

class WebWorkDefKeyValueMap {
    public webWorkKey: string;
    public resultKey: string;
    public comment: string;
    constructor({
        webWorkKey,
        resultKey,
        comment
    }: WebWorkDefKeyValueMapOptions) {
        this.webWorkKey = webWorkKey;
        this.resultKey = resultKey ?? webWorkKey;
        this.comment = comment ?? '';
    }

    get regex(): RegExp {
        // if any of the keys included regex characters it would be a problem
        // but they are predefined and they don't so we are ignorming
        return new RegExp(`^${this.webWorkKey}\\s*=\\s*(.*)?\\s*`);
    }
}

const webWorkDefKeyMaps: Array<WebWorkDefKeyValueMap> = [
    new WebWorkDefKeyValueMap({ webWorkKey: 'assignmentType' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'openDate', comment: 'Dates do not have timezones due to limitations'}),
    new WebWorkDefKeyValueMap({ webWorkKey: 'reducedScoringDate' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'dueDate' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'answerDate', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'enableReducedScoring' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'paperHeaderFile', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'screenHeaderFile', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'description', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'restrictProbProgression', comment: 'Not supported' }),

    new WebWorkDefKeyValueMap({ webWorkKey: 'emailInstructor', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'attemptsPerVersion' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'timeInterval' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'versionsPerInterval' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'versionTimeLimit' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'problemRandOrder' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'problemsPerPage', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'hideScore' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'hideScoreByProblem' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'hideWork' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'capTimeLimit' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'rederlyAvailableVersions', comment: 'WeBWorK does this based on dates, since that is not the case here including this value as well (with fallback with dates)' }),
];

const webWorkDefProblemKeyMaps: Array<WebWorkDefKeyValueMap> = [
    new WebWorkDefKeyValueMap({ webWorkKey: 'problem_id' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'source_file' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'value' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'max_attempts' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'showMeAnother', comment: 'showMeAnother in webwork is number of attempts before but rederly does not support that' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'prPeriod', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'counts_parent_grade', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'att_to_open_children', comment: 'Not supported' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'rederlyAdditionalPaths' }),
    new WebWorkDefKeyValueMap({ webWorkKey: 'rederlyRandomSeedRestrictions' }),
];

export class Problem {
    public problem_id?: string;
    public source_file?: string;
    public value?: string;
    public max_attempts?: string;
    public showMeAnother?: string;
    public prPeriod?: string;
    public counts_parent_grade?: string;
    public att_to_open_children?: string;
    public rederlyAdditionalPaths? : string;
    public rederlyRandomSeedRestrictions? : string;
}

export default class WebWorkDef {
    public problems: Array<Problem> = [];
    public assignmentType?: string;
    public enableReducedScoring?: string;
    public attemptsPerVersion?: string;
    public timeInterval?: string;
    public versionsPerInterval?: string;
    public versionTimeLimit?: string;
    public problemRandOrder?: string;
    public problemsPerPage?: string;
    public hideScore?: string;
    public hideScoreByProblem?: string;
    public hideWork?: string;
    public capTimeLimit?: string;

    // Not used
    public openDate?: string;
    public dueDate?: string;
    public reducedScoringDate?: string;

    // Not supported
    public answerDate?: string;
    public description?: string;
    public restrictProbProgression?: string;
    public emailInstructor?: string;
    public paperHeaderFile?: string;
    public screenHeaderFile?: string;

    public rederlyAvailableVersions?: string;
    
    private v1ListMode = false;

    constructor(content: string) {
        const lines = content.split('\n');
        let currentProblem: Problem | null = null;
        lineLoop: for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber].trim();
            if (line.length === 0) {
                continue lineLoop;
            } else if (this.v1ListMode) {
                const tokens = line.split(',');
                if (tokens.length > 3) {
                    logger.warn(`V1 Def file has more than 3 values: [${line}]`);
                }
                const problem = new Problem();
                // Technically this field can't be nil since split on a string will at least return the string
                // but going to add nil accessor anyway
                // webwork field
                // eslint-disable-next-line @typescript-eslint/camelcase
                problem.source_file = tokens[0]?.trim();
                problem.value = tokens[1]?.trim();
                // webwork field
                // eslint-disable-next-line @typescript-eslint/camelcase
                problem.max_attempts = tokens[2]?.trim();

                if (problem.value !== undefined && isNaN(parseInt(problem.value, 10))) {
                    throw new Error(`Error parsing v1 problem list, value ${problem.value} is not a number`);
                }

                if (problem.max_attempts !== undefined && isNaN(parseInt(problem.max_attempts, 10))) {
                    throw new Error(`Error parsing v1 problem list, max_attempts ${problem.max_attempts} is not a number`);
                }

                this.problems.push(problem);
            } else if (line === 'problem_start') {
                if (currentProblem !== null) {
                    throw new Error('Problem started in the middle of a problem');
                } else {
                    currentProblem = new Problem();
                }
            } else if (line === 'problem_end') {
                if (currentProblem === null) {
                    throw new Error('Problem ended when it wasn\'t currently in a problem');
                } else {
                    this.problems.push(currentProblem);
                    currentProblem = null;
                }
            } else if (line === 'problemListV2') {
                // Nothing to do
            } else if (line.split('=')[0] !== undefined && line.split('=')[0] !== null && line.split('=')[0].trim() === 'problemList') {
                this.v1ListMode = true;
            } else {
                if (line.startsWith('#')) {
                    // This does not handle mid line comments
                    logger.debug('Comment in def file');
                } else if (currentProblem === null) {
                    for (let keyIndex = 0; keyIndex < webWorkDefKeyMaps.length; keyIndex++) {
                        const webWorkDefKeyMap = webWorkDefKeyMaps[keyIndex];
                        let match;
                        if (match = line.match(webWorkDefKeyMap.regex)) {
                            // TODO this was a hack to be able to use dynamic tags against "this"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (this as any)[webWorkDefKeyMap.resultKey] = match[1];
                            continue lineLoop;
                        }
                    }
                    logger.warn(`Global field not found for line: ${line}`);
                } else {
                    for (let keyIndex = 0; keyIndex < webWorkDefProblemKeyMaps.length; keyIndex++) {
                        const webWorkDefKeyMap = webWorkDefProblemKeyMaps[keyIndex];
                        let match;
                        if (match = line.match(webWorkDefKeyMap.regex)) {
                            // TODO this was a hack to be able to use dynamic tags against "this"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (currentProblem as any)[webWorkDefKeyMap.resultKey] = match[1];
                            continue lineLoop;
                        }
                    }
                    logger.error(`Problem field not found for line: ${line}`);
                }
            }
        }
    }

    isExam(): boolean {
        return ['gateway', 'proctored_gateway'].indexOf(this.assignmentType?.toLowerCase() ?? '') >= 0;
    }

    static characterBoolean = (value: string | undefined): boolean => {
        return value === 'Y';
    }

    static numberBoolean = (value: string | undefined): boolean => {
        return value !== undefined ? Boolean(parseInt(value, 0)) : false;
    }

    dumpAsDefFileContent(): string {
        let result = '';
        webWorkDefKeyMaps.forEach((keyObj) => {
            if (isKeyOf(keyObj.webWorkKey, this)) {
                if (keyObj.comment) {
                    result += `# ${keyObj.comment}\n`;
                }
                result += `${keyObj.webWorkKey} = ${this[keyObj.webWorkKey]}\n`;
            }
        });

        result += '\n\nproblemListV2\n\n';
        this.problems.forEach((problem) => {
            result += 'problem_start\n'
            webWorkDefProblemKeyMaps.forEach((keyObj) => {
                if (isKeyOf(keyObj.webWorkKey, problem)) {
                    if (keyObj.comment) {
                        result += `# ${keyObj.comment}\n`
                    }
                    result += `${keyObj.webWorkKey} = ${problem[keyObj.webWorkKey]}\n`
                }
            });
            result += 'problem_end\n\n'
        });
        return result;
    }
}
