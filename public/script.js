 // Global variables for dynamic inputs
 let maintenanceItems = 1;
 let miscItems = 1;

 // Event listeners
 document.getElementById('requestType').addEventListener('change', function() {
     const otherDiv = document.getElementById('otherRequestTypeDiv');
     otherDiv.style.display = this.value === 'Other' ? 'block' : 'none';
 });

 document.getElementById('budgetRequestForm').addEventListener('input', updateSummary);

 // Functions for dynamic inputs
 function addMaintenanceInput() {
     const container = document.getElementById('maintenanceContainer');
     const newGroup = createInputGroup('maintenance');
     container.appendChild(newGroup);
     maintenanceItems++;
     updateSummary();
 }

 function addMiscInput() {
     const container = document.getElementById('miscContainer');
     const newGroup = createInputGroup('misc');
     container.appendChild(newGroup);
     miscItems++;
     updateSummary();
 }

 function createInputGroup(type) {
     const div = document.createElement('div');
     div.className = 'input-group';
     div.innerHTML = `
         <input type="text" class="${type}-desc" placeholder="Description" required>
         <input type="number" class="${type}-amount" placeholder="US Dollar" required>
         <button type="button" class="remove-btn" onclick="removeInput(this)">X</button>
     `;
     return div;
 }

 function removeInput(button) {
     button.parentElement.remove();
     updateSummary();
 }

 // Calculate totals and update summary
// Update the summary calculation function
function updateSummary() {
    let summary = {
        utilities: 0,
        allowance: 0,
        lkdAssistance: 0,
        food: 0,
        foodCOH: 0,
        transportation: 0,
        transportCOH: 0,
        maintenance: 0,
        miscellaneous: 0
    };

    // Calculate utilities total
    summary.utilities = sumValues(['rent', 'electricity', 'water', 'gas', 'internet', 'communication']);

    // Calculate allowance total
    summary.allowance = sumValues(['workersAllowance', 'foodAllowance']);

    // Calculate LKD assistance total
    summary.lkdAssistance = sumValues(['lkdMedical', 'lkdFinancial']);

    // Calculate food total
    summary.food = sumValues(['foodBudgetBrethren', 'foodExpenseBS']);
    summary.foodCOH = parseFloat(document.getElementById('foodExpenseCOH').value) || 0;

    // Calculate transportation total
    summary.transportation = sumValues(['transportIndividual', 'transportBS']);
    summary.transportCOH = parseFloat(document.getElementById('transportCOH').value) || 0;

    // Calculate maintenance total
    summary.maintenance = sumDynamicInputs('maintenance-amount');

    // Calculate miscellaneous total
    summary.miscellaneous = sumDynamicInputs('misc-amount');

    // Calculate grand total including COH values
    const grandTotal = (
        summary.utilities +
        summary.allowance +
        summary.lkdAssistance +
        summary.food +
        summary.transportation +
        summary.maintenance +
        summary.miscellaneous +
        summary.foodCOH +     // Add COH values (not subtract)
        summary.transportCOH   // Add COH values (not subtract)
    );

    // Update summary display
    document.getElementById('summaryContent').innerHTML = `
        <p>Utilities: $${summary.utilities.toFixed(2)}</p>
        <p>Allowance: $${summary.allowance.toFixed(2)}</p>
        <p>LKD Assistance: $${summary.lkdAssistance.toFixed(2)}</p>
        <p>Food Budget Total: $${summary.food.toFixed(2)}</p>
        <p>Food COH Remaining: $${summary.foodCOH.toFixed(2)}</p>
        <p>Transportation Total: $${summary.transportation.toFixed(2)}</p>
        <p>Transportation COH Remaining: $${summary.transportCOH.toFixed(2)}</p>
        <p>Maintenance: $${summary.maintenance.toFixed(2)}</p>
        <p>Miscellaneous: $${summary.miscellaneous.toFixed(2)}</p>
    `;
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

 function sumValues(ids) {
     return ids.reduce((sum, id) => {
         const value = parseFloat(document.getElementById(id).value) || 0;
         return sum + value;
     }, 0);
 }

 function sumDynamicInputs(className) {
     return Array.from(document.getElementsByClassName(className))
         .reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
 }

 // Generate PDF
 function generatePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margin = 20;
        let yPos = margin;

        // Add title
        doc.setFontSize(16);
        doc.text('Budget Request Summary', margin, yPos);
        yPos += 10;

        // Add basic information
        doc.setFontSize(12);
        yPos += 10;
        doc.text(`Date: ${document.getElementById('date').value}`, margin, yPos);
        yPos += 10;
        doc.text(`Country: ${document.getElementById('country').value}`, margin, yPos);
        yPos += 10;
        doc.text(`City: ${document.getElementById('city').value}`, margin, yPos);
        yPos += 10;
        doc.text(`Budget Month: ${document.getElementById('budgetMonth').value}`, margin, yPos);
        yPos += 10;
        doc.text(`Request Type: ${document.getElementById('requestType').value}`, margin, yPos);
        yPos += 10;
        doc.text(`Requested By: ${document.getElementById('requestedBy').value}`, margin, yPos);
        yPos += 10;
        doc.text(`Approved By: ${document.getElementById('approvedBy').value}`, margin, yPos);
        yPos += 20;

        // Add summary content with page break check
        doc.text('Summary:', margin, yPos);
        yPos += 10;
        const summaryLines = document.getElementById('summaryContent').innerText.split('\n');
        
        summaryLines.forEach(line => {
            // Check if we need a new page
            if (yPos > 270) {
                doc.addPage();
                yPos = margin;
            }
            
            // Handle long lines
            const splitLine = doc.splitTextToSize(line, 170);
            doc.text(splitLine, margin, yPos);
            yPos += (splitLine.length * 7);
        });

        // Add grand total
        yPos += 10;
        if (yPos > 270) {
            doc.addPage();
            yPos = margin;
        }
        doc.text(`Grand Total: $${document.getElementById('grandTotal').textContent}`, margin, yPos);

        // Add notes
        const notes = document.getElementById('notes').value;
        if (notes) {
            yPos += 20;
            if (yPos > 270) {
                doc.addPage();
                yPos = margin;
            }
            doc.text('Notes:', margin, yPos);
            yPos += 10;
            const splitNotes = doc.splitTextToSize(notes, 170);
            doc.text(splitNotes, margin, yPos);
        }

        // Generate filename
        const fileName = `Budget_Request_${document.getElementById('country').value}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Handle different devices
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Mobile device
            doc.save(fileName);
        } else {
            // Desktop - can optionally open in new window
            doc.save(fileName);
            // Alternative: window.open(doc.output('bloburl'), '_blank');
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'PDF generated successfully!';
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
        console.error('PDF generation error:', error);
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error generating PDF. Please try again.';
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    }
}

 // Submit to Google Sheets
// Add this function to handle form submission
async function submitToGoogleSheets(formData) {
// Replace with your Google Apps Script Web App URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbx6U66PBAROlm2C_aFkwJNhPn1pzIturjyH3OjHDUHCXkrEOb8Agd8pkvUg7Dut8tgtYw/exec';

try {
 const response = await fetch(scriptURL, {
     method: 'POST',
     mode: 'no-cors', // This is important for cross-origin requests
     cache: 'no-cache',
     headers: {
         'Content-Type': 'application/json',
     },
     body: JSON.stringify(formData)
 });

 return true; // Assume success with no-cors mode
} catch (error) {
 console.error('Error:', error);
 return false;
}
}

// Update the form submission event listener
// Update the form submission event listener
document.getElementById('budgetRequestForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    try {
        // Collect all form data
        const formData = {
            timestamp: new Date().toISOString(),
            country: document.getElementById('country').value,
            city: document.getElementById('city').value,
            date: document.getElementById('date').value,
            budgetMonth: document.getElementById('budgetMonth').value,
            requestType: document.getElementById('requestType').value,
            otherRequestType: document.getElementById('otherRequestType').value || '',
            requestedBy: document.getElementById('requestedBy').value,
            approvedBy: document.getElementById('approvedBy').value,
            
            // Utilities
            rent: parseFloat(document.getElementById('rent').value) || 0,
            electricity: parseFloat(document.getElementById('electricity').value) || 0,
            water: parseFloat(document.getElementById('water').value) || 0,
            gas: parseFloat(document.getElementById('gas').value) || 0,
            internet: parseFloat(document.getElementById('internet').value) || 0,
            communication: parseFloat(document.getElementById('communication').value) || 0,
            
            // Allowance
            workersAllowance: parseFloat(document.getElementById('workersAllowance').value) || 0,
            foodAllowance: parseFloat(document.getElementById('foodAllowance').value) || 0,
            
            // LKD Assistance
            lkdMedical: parseFloat(document.getElementById('lkdMedical').value) || 0,
            lkdFinancial: parseFloat(document.getElementById('lkdFinancial').value) || 0,
            
            // Food
            foodBudgetBrethren: parseFloat(document.getElementById('foodBudgetBrethren').value) || 0,
            foodExpenseBS: parseFloat(document.getElementById('foodExpenseBS').value) || 0,
            foodExpenseCOH: parseFloat(document.getElementById('foodExpenseCOH').value) || 0, // Added COH field
            
            // Transportation
            transportIndividual: parseFloat(document.getElementById('transportIndividual').value) || 0,
            transportBS: parseFloat(document.getElementById('transportBS').value) || 0,
            transportCOH: parseFloat(document.getElementById('transportCOH').value) || 0, // Added COH field
            
            // Maintenance items
            maintenanceItems: Array.from(document.getElementsByClassName('maintenance-desc')).map((desc, index) => ({
                description: desc.value,
                amount: parseFloat(document.getElementsByClassName('maintenance-amount')[index].value) || 0
            })),
            
            // Miscellaneous items
            miscItems: Array.from(document.getElementsByClassName('misc-desc')).map((desc, index) => ({
                description: desc.value,
                amount: parseFloat(document.getElementsByClassName('misc-amount')[index].value) || 0
            })),
            
            // Notes
            notes: document.getElementById('notes').value,
            
            // Totals
            grandTotal: parseFloat(document.getElementById('grandTotal').textContent) || 0
        };

        // For debugging - remove in production
        console.log('Form Data:', formData);

        // Submit to Google Sheets
        const success = await submitToGoogleSheets(formData);
        
        if (success) {
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Budget request submitted successfully!';
            document.body.appendChild(successMessage);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
            
            // Reset form
            this.reset();
            updateSummary();
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error submitting the form. Please try again.';
        document.body.appendChild(errorMessage);
        
        // Remove error message after 3 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
        
        console.error('Submission error:', error);
    } finally {
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});