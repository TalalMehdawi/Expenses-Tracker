// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.
import express from "express";
import pg from "pg";
import  dotenv  from "dotenv";
import cors from "cors";
dotenv.config();
const {Pool}=pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})


const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

app.get('/api/expenses', async (req,res)=>{

    try{
            let data=await pool.query("SELECT id, title, amount::float, category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses");
            res.status(200).json(data.rows);

        }
        catch(err)
        {
            console.error(err);
            res.status(500).json({message:"internal server error"});
        }
})


app.get('/api/expenses/:id', async (req,res)=>{

    const id = parseInt(req.params.id);

    if(isNaN(id))
    {
        return res.status(400).json({message:"id is not valid"})
    }

    try{

            let data=await pool.query(`SELECT id, title, amount::float, category, to_char(date, 'YYYY-MM-DD')
                                       AS date FROM expenses WHERE id = $1`, [id]);

            if(data.rows.length===0)
            {
                return res.status(404).json({message:"Not Found"})
            }
            res.status(200).json(data.rows[0]);

        }
        catch(err)
        {
            console.error(err);
            res.status(500).json({message:"internal server error"});
        }
})

app.post('/api/expenses',async (req,res)=>{

    const {title,amount,category,date}=req.body;

    const numAmount = Number(amount);
     if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: "Title is required" });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
    }
    const validCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
    }
    if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Invalid date" });
    }

    try{

        let data=await pool.query(`INSERT INTO expenses (title, amount, category, date)
                                   VALUES ($1, $2, $3, $4) RETURNING id, title, amount::float,
                                    category, to_char(date, 'YYYY-MM-DD') AS date`,
            [title,numAmount,category,date]);
        res.status(201).json(data.rows[0]);
        }
        catch(err)
        {
            console.error(err);
            res.status(500).json({message:"internal server error"});
        }
})

app.put('/api/expenses/:id',async (req,res)=>{
    const id =Number(req.params.id);
    const {title,amount,category,date}=req.body;

    if(isNaN(id))
    {
        return res.status(400).json({message:"id is not valid"})
    }
    const numAmount = Number(amount);
     if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: "Title is required" });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
    }
    const validCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
    }
    if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Invalid date" });
    }
    try{
        const data= await pool.query(`UPDATE expenses SET title = $1,amount =$2,category=$3,date=$4 
        WHERE id=$5 RETURNING id, title, amount::float, category, to_char(date, 'YYYY-MM-DD') AS date`,
        [title,numAmount,category,date,id]);
        if(data.rows.length===0)
        {
            return res.status(404).json({message:"expenses is not found"})
        }
        res.status(200).json(data.rows[0])
       }
       catch(err)
       {
            console.error(err);
            res.status(500).json({message:"internal server error"});
       }
    

})
app.delete('/api/expenses/:id',async (req,res)=>{
    const id =Number(req.params.id);

    if(isNaN(id))
    {
        return res.status(400).json({message:"id is not valid"})

    }
    try{
        const data= await pool.query(`delete from expenses where id =$1
        RETURNING id, title, amount::float, category, to_char(date, 'YYYY-MM-DD') AS date`,
        [id] );
        if(data.rows.length===0)
        {
            return res.status(404).json({message:"expenses is not found"})
        }

        res.status(200).json({message:"expenses deleted succsesfully "})
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message:"internal server error"});
    }

 
})
app.listen(port,()=>{
    console.log(`App is Running in Port ${port}`);
})



