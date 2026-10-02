// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).

const API_URL = "http://localhost:3000/api/expenses";

let currentCategory="All";

async function getExpenses() 
{


    showSpinner();
    try {
        
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to fetch expenses");
        return await response.json();
    } catch (err) {
        showAlert(err.message); 
        throw err;
    } finally {
        hideSpinner(); 
    }
   
}



async function renderTableAndSummury() {

    let expenseData = await getExpenses();

    if(currentCategory!=="All")
    {
        expenseData=expenseData.filter(ele=>ele.category===currentCategory);
    }

    const tableBody = document.getElementById("expensesTableBody");
    tableBody.innerHTML = "";

    expenseData.forEach(element => {
        renderOneElement(element,tableBody)});

    renderSummary(expenseData);
}


async function renderSummary(expenseData) {

    let total = expenseData.reduce((acc,element)=>element.amount+acc,0);
    if(expenseData.length===0)
    {
        document.getElementById("totalAmount").textContent=0;
        document.getElementById("expenseCount").textContent=0;
        document.getElementById("highestAmount").textContent=0;
        return;
    }
    const highestAmount=Math.max(...expenseData.map(ele=>ele.amount));
    document.getElementById("totalAmount").textContent=total;
    document.getElementById("expenseCount").textContent=expenseData.length;
    document.getElementById("highestAmount").textContent=highestAmount.toFixed(2);
}


renderTableAndSummury();

const categoryFilter=document.getElementById("categoryFilter");

categoryFilter.addEventListener("change", async (event) => {
   currentCategory= event.target.value;
   renderTableAndSummury();
});

async function deleteExpense(id) {
    const response = await fetch(API_URL + "/" + id, { method: "DELETE" });

    if (!response.ok) {
        throw new Error("Failed to delete expense");
    }
}

const addExpenseButton=document.getElementById("add-expense");

addExpenseButton.addEventListener('click',addExpense);

async function addExpense()
{

   const expense={
    title:document.getElementById("title").value,
    amount:document.getElementById("amount").value,
    category:document.getElementById("category").value,
    date:document.getElementById("date").value
 }
    fetch(API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(expense)
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
    await renderTableAndSummury();
}


function fillFormForEdit(expense) {
    document.getElementById("editId").value = expense.id;
    document.getElementById("editTitle").value = expense.title;
    document.getElementById("editAmount").value = expense.amount;
    document.getElementById("editCategory").value = expense.category;
    document.getElementById("editDate").value = expense.date;

    const modal = new bootstrap.Modal(document.getElementById("editModal"));
    modal.show();


}

const editForm = document.getElementById("editForm");

editForm.addEventListener("submit", async (e) => {

    const id = document.getElementById("editId").value;
    const updatedExpense = {
        title: document.getElementById("editTitle").value,
        amount: Number(document.getElementById("editAmount").value),
        category: document.getElementById("editCategory").value,
        date: document.getElementById("editDate").value
    };

    try {
        await updateExpense(id, updatedExpense);
        await renderTableAndSummury();
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    } catch (err) {
        alert("Failed to update: " + err.message);
    }
});


async function updateExpense(id, updatedExpense)
{
     fetch(API_URL+`/${id}` ,{
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedExpense)
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
   await renderTableAndSummury();
}

const sbtn=document.getElementById("sbtn");

sbtn.addEventListener('click',search);

function renderOneElement(element,tableBody)
{

     const tdTitle = document.createElement("td");
        tdTitle.textContent = element.title;

        const tdAmount = document.createElement("td");
        tdAmount.textContent = element.amount;

        const tdCategory = document.createElement("td");
        tdCategory.textContent = element.category;

        const tdDate = document.createElement("td");
        tdDate.textContent = element.date;

        // === عمود الأزرار الجديد ===
        const tdActions = document.createElement("td");
        tdActions.className="text-end";
        const editBtn = document.createElement("button");
        
        editBtn.className = "btn btn-sm btn-dark me-1 ";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger ";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", async () => {
            try {
                await deleteExpense(element.id);
                await renderTableAndSummury();
            } catch (err) {
                alert("Failed to delete: " + err.message);
            }
        });

        editBtn.addEventListener("click", () => {
            fillFormForEdit(element);
        });

        tdActions.appendChild(editBtn);
        tdActions.appendChild(deleteBtn);
  

        const tableRow = document.createElement("tr");

        tableRow.appendChild(tdTitle);
        tableRow.appendChild(tdAmount);
        tableRow.appendChild(tdCategory);
        tableRow.appendChild(tdDate);
        tableRow.appendChild(tdActions); // أضفنا العمود هون
        tableBody.appendChild(tableRow);
    

}

async function search ()
{
    let expenseData = await getExpenses();
    const searchValue=document.getElementById("searchInput").value;
    let element = expenseData.filter(e=>e.title===searchValue);
    if(!element)
    {
        alert("title is not found ....!");
        return;
    }
    const tableBody = document.getElementById("expensesTableBody");
    tableBody.innerHTML = "";
    element.forEach(e=>renderOneElement(e,tableBody));
    renderOneElement(element,tableBody);
    
}


function showSpinner() {
    document.getElementById("spinner").classList.remove("d-none");
}

function hideSpinner() {
    document.getElementById("spinner").classList.add("d-none");
}

function showAlert(message) {
    const box = document.getElementById("alertBox");
    box.textContent = message;
    box.classList.remove("d-none");
}

function hideAlert() {
    document.getElementById("alertBox").classList.add("d-none");
}
