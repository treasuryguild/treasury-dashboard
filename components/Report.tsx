import React from 'react';
import { useMyVariable } from '../context/MyVariableContext'
import { getReport } from '../utils/getReport';

const Report = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    async function generateReport() {
        let report = await getReport(myVariable.transactions);
        setMyVariable(prevState => ({ ...prevState, report }));
        console.log("contributions", myVariable.report, report)
    }
    
    return (
        <div>
            <h2>This is the Report component</h2>
            <p>Content for the report goes here.</p>
            <button onClick={generateReport}>
              Generate Report
            </button>
        </div>
    );
};

export default Report;
