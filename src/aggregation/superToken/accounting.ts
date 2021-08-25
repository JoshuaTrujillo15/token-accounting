import {
	isFlowEvent,
	AccountToken,
	TokenMetadata,
	OutputFlow,
	ChainId,
	OutputTransfer,
	isTransferEvent
} from '../../superTokenTypes'
import { getSecondsIn } from '../../helpers/time'
import BN from 'bn.js'

export const getFlowState = (
	day: number,
	accountTokens: Array<AccountToken>,
	networkId: ChainId
): Array<OutputFlow> => {
	const secondsInDay = getSecondsIn('day')
	let flows: Array<{
		start: number
		end: number
		sender: string
		recipient: string
		txHash: string
		flowRate: string
		token: TokenMetadata
		flowRateChanges: Array<{
			// ONLY FOR CHANGES *DURING* DAY
			timestamp: number
			previousFlowRate: string
		}>
	}> = []
	let outputFlows: Array<OutputFlow> = []

	accountTokens.forEach(accountToken => {
		const { metadata: token, events } = accountToken
		const eventsBeforeDay = events.filter(event => event.timestamp < day)

		// BEFORE DAY
		eventsBeforeDay.forEach(event => {
			// typescript wont recognize a `.filter()` type-guard.
			if (isFlowEvent(event)) {
				// get index of flow if exists
				const index = flows.findIndex(
					flow =>
						flow.sender === event.sender &&
						flow.recipient === event.recipient &&
						flow.token.id === token.id
				)

				// destruct event
				const { timestamp, sender, recipient, txHash, flowRate } = event

				// flow start
				if (event.oldFlowRate === '0') {
					if (index === -1) {
						flows.push({
							start: timestamp,
							end: -1, // indicates flow is open
							sender,
							recipient,
							txHash,
							flowRate,
							token,
							flowRateChanges: []
						})
					} else {
						throw Error('duplicate flow (sender, recipient, token)')
					}

					// flow stop
				} else if (event.flowRate === '0') {
					if (index !== -1) {
						flows.splice(index, 1)
					} else {
						throw Error(
							'flow-stop event triggered on non-existent flow'
						)
					}

					// flow update
				} else {
					if (index !== -1) {
						flows[index].flowRate = event.flowRate
					} else {
						throw Error(
							'flow-update event triggered on non-existent flow'
						)
					}
				}
			}
		})

		const eventsDuringDay = events.filter(
			event =>
				day <= event.timestamp && event.timestamp < day + secondsInDay
		)

		// DURING DAY
		eventsDuringDay.forEach(event => {
			// typescript wont recognize a `.filter()` type-guard.
			if (isFlowEvent(event)) {
				// get index of flow if exists
				const index = flows.findIndex(
					flow =>
						flow.sender === event.sender &&
						flow.recipient === event.recipient &&
						flow.token.id === token.id
				)

				// destruct event
				const { timestamp, sender, recipient, txHash, flowRate } = event

				// flow start
				if (event.oldFlowRate === '0') {
					if (index === -1) {
						flows.push({
							start: timestamp,
							end: -1, // indicates flow is open
							sender,
							recipient,
							txHash,
							flowRate,
							token,
							flowRateChanges: []
						})
					} else {
						throw Error('duplicate flow (sender, recipient, token)')
					}

					// flow stop
				} else if (event.flowRate === '0') {
					if (index !== -1) {
						flows[index].end = event.timestamp
					} else {
						throw Error(
							'flow-stop event triggered on non-existent flow'
						)
					}

					// flow update
				} else {
					if (index !== -1) {
						// records previous flowRate, updates with new
						flows[index].flowRateChanges.push({
							timestamp: event.timestamp,
							previousFlowRate: flows[index].flowRate
						})
						flows[index].flowRate = event.flowRate
					} else {
						throw Error(
							'flow-update event triggered on non-existent flow'
						)
					}
				}
			}
		})

		// get outputFlows from flows present during day
		flows.forEach(flow => {
			const {
				start,
				end,
				sender,
				recipient,
				txHash,
				flowRate,
				flowRateChanges
			} = flow

			// calculate amount for the day
			let amountToken: string
			if (flowRateChanges.length === 0) {
				amountToken = new BN(flowRate)
					.mul(new BN(secondsInDay))
					.toString()
			} else {
				amountToken = flowRateChanges.reduce(
					(amount, curr, idx, arr) => {
						if (idx === 0) {
							return new BN(amount)
								.add(
									new BN(curr.timestamp - day).mul(
										new BN(curr.previousFlowRate)
									)
								)
								.toString()
						} else {
							return new BN(amount)
								.add(
									new BN(
										curr.timestamp - arr[idx - 1].timestamp
									).mul(new BN(curr.previousFlowRate))
								)
								.toString()
						}
					},
					'0'
				)
			}

			outputFlows.push({
				date: day,
				start,
				end,
				sender,
				recipient,
				networkId,
				txHash,
				amountToken,
				amountFiat: '',
				exchangeRate: '',
				token
			})
		})
	})
	return outputFlows
}

export const getTransfers = (
	day: number,
	accountTokens: Array<AccountToken>,
	networkId: string
): Array<OutputTransfer> => {
	let outputTransfers: Array<OutputTransfer> = []

	accountTokens.forEach(accountToken => {
		const { metadata: token, events } = accountToken
		const secondsInDay = getSecondsIn('day')
		const dayEvents = events.filter(
			event =>
				event.timestamp > day && event.timestamp < day + secondsInDay
		)

		dayEvents.forEach(event => {
			// typescript wont recognize a `.filter()` type-guard.
			if (isTransferEvent(event)) {
				const { txHash, sender, recipient, value: amountToken } = event

				outputTransfers.push({
					date: day,
					sender,
					recipient,
					txHash,
					networkId,
					amountToken,
					amountFiat: '',
					exchangeRate: '',
					token
				})
			}
		})
	})

	return outputTransfers
}