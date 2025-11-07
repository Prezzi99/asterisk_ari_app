import { saveSheet } from '../database/utils.js';
import { testRegExp } from './utils.js';
import * as xlsx from 'xlsx';

export async function upload(req, res) {
    const { user_id, title } = req.body;
    const { file } = req.files;

    const is_xls = /^.+xlsx?$/.test(file?.name) && /^application.+sheet$/.test(file?.mimetype);
    const pairs = [ 
        [/^\d+$/, [user_id]], 
        [/^\w{1,50}$/, [title]] 
    ];

    if (!testRegExp(pairs) || !is_xls) return res.status(400).send('');

    // Parse the file as xls
    let workbook = xlsx.read(file.data, {
        type: 'buffer',
        cellFormula: false,
        raw: true,
    });
    
    if (workbook.SheetNames.length > 1) return res.status(400).send('workbook_has_multiple_sheets.');

    // Get the first sheet in the excel file
    let sheet_one = workbook.Sheets[workbook.SheetNames[0]];

    const [sheet_as_json] = xlsx.utils.sheet_to_json(sheet_one, { blankrows: false, defval: '' });

    // Check if the sheet has a telephone column
    const columns = Object.keys(sheet_as_json);
    if (!columns.includes('Telephone')) return res.status(400).send('no_telephone_column.');

    workbook = xlsx.write(workbook, {bookType: 'xlsx', type: 'buffer'}) // Convert the sheet to a buffer

    await saveSheet(user_id, title, workbook)
    .then(result => res.status(200).send(''))
    .catch(err => {
        if (err.errno) return res.status(409).send('title_taken.');
        
        return res.status(500).send('Oops, something went wrong.');
    });
}