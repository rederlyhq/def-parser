import fs = require('fs');
import WebWorkDef from './WebWorkDef';

const readFile  = (filePath:string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err,data) => {
            if(err) {
                return reject(err);
            } else {
                return resolve(data.toString());
            }
        });
    })
};

const defFilePath = process.argv[2];
console.log(defFilePath);

(async () => {
    const content = await readFile(defFilePath);
    console.log(new WebWorkDef(content));
})();