// MUST be first
import dotenv from 'dotenv'
dotenv.config()

import Agenda from 'agenda'
import express from 'express'
import cors from 'cors'
import accountsRouter from './routes/accounts'
import Connector from './database/dbCommunicator'
import { update } from './routes/accounts/update'

const app = express()
const port = process.env.SERVER_PORT || 5000

const dbUrl = process.env.DB_URL
if (dbUrl === undefined) throw Error('dotenv failed to load DB_URL')
Connector.ConnectToDB(dbUrl)

const agenda = new Agenda({ db: { address: dbUrl } })
agenda.define('data aggregation', async () => {
	try {
		await update()
	} catch (error) {
		console.error(error)
	}
})
agenda.on('ready', async () => {
	agenda.start()
	await agenda.every('24 hours', 'data_aggregation_job')
})

app.use(cors())
app.use(express.json())
app.route('/test').get((_, res) => res.send('Everything Is Fine :)'))
app.use('/accounts', accountsRouter)

app.listen(port, () => console.log(`Listening on port ${port}`))

// for testing
export default app
