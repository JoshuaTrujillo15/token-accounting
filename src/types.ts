// USER QUERY TYPE
export interface UserQueryType {
	id?: string
	start?: string
	end?: string
}

// TOKEN METADATA
export interface ERC20Metadata {
	id: string
	name: string
	symbol: string
}

export interface SuperTokenMetadata {
	id: string
	name: string
	symbol: string
	underlyingAddress: string
}

export type TokenMetadata = ERC20Metadata | SuperTokenMetadata

// PRICE FEED
export interface CoinHistoryInputContract {
	id: ChainName // of the the asset platform (etherium,xdai, etc. )
	contractAddress: string
	vsCurrency: string // usd, etc
}

export interface DailyPrice {
	timestamp: number
	conversion: string
}

// DB TYPES
export interface TestDocumentType {
	price: string
	other: number
}

export interface AccountDocumentType {
	address: string
	flowState: OutputFlow[]
	transfers: OutputTransfer[]
	gradeEvents: GradeEvent[]
}

// QUERY RETURN TYPES
// polygon-pos and ethereum ERC20
export interface QueryERC20Transfer {
	blockNumber: string
	timeStamp: string
	hash: string
	nonce: string
	blockHash: string
	from: string
	contractAddress: string
	to: string
	value: string
	tokenName: string
	tokenSymbol: string
	tokenDecimal: string
	transactionIndex: string
	gas: string
	gasPrice: string
	gasUsed: string
	cumulativeGasUsed: string
	input?: string
	confirmations: string
}

// xdai (small, but breaking diffs) ERC20
export interface QueryxDaiTransfer {
	value: string
	blockHash: string
	blockNumber: string
	confirmations: string
	contractAddress: string
	cumulativeGasUsed: string
	from: string
	gas: string
	gasPrice: string
	gasUsed: string
	hash: string
	input: string
	logIndex: string
	nonce: string
	timeStamp: string
	to: string
	tokenDecimal: string
	tokenName: string
	tokenSymbol: string
	transactionIndex: string
}

// The Graph
interface QueryToken {
	id: string
	name: string
	symbol: string
	underlyingAddress: string
}

interface QueryTransfer {
	id: string
	transaction: {
		id: string
		timestamp: string
	}
	to: {
		id: string
		account: {
			id: string
		}
	}
	from: {
		id: string
		account: {
			id: string
		}
	}
	value: string
}

interface QueryFlowEvent {
	id: string
	transaction: {
		id: string
		timestamp: string
	}
	oldFlowRate: string
	flowRate: string
}

interface QueryFlow {
	id: string
	flowRate: string
	lastUpdate: string
	owner: {
		id: string
	}
	recipient: {
		id: string
	}
	events: QueryFlowEvent[]
}

interface QueryGradeEvent {
	id: string
	transaction: {
		id: string
		timestamp: string
	}
	token: QueryToken
	amount: string
}

export interface QueryAccountToken {
	id: string
	token: QueryToken
	inTransfers: QueryTransfer[]
	outTransfers: QueryTransfer[]
	flows: {
		// NOT valid ID, just preventing Apollo ID crash.
		id: string
		inFlows: QueryFlow[]
		outFlows: QueryFlow[]
	}
	gradeEvents: {
		// NOT valid ID, just preventing Apollo ID crash.
		id: string
		upgradeEvents: QueryGradeEvent[]
		downgradeEvents: QueryGradeEvent[]
	}
}

// INPUT
export type ChainName = 'xdai' | 'polygon-pos' | 'ethereum'

export type ChainId = '0x64' | '0x89' | '0x01'

export interface TransferEvent {
	id: string
	timestamp: number
	txHash: string
	sender: string
	recipient: string
	value: string
	type: 'transfer'
}

export interface FlowEvent {
	id: string
	timestamp: number
	txHash: string
	sender: string
	recipient: string
	oldFlowRate: string
	flowRate: string
	type: 'flow'
}

export type TokenEvent = TransferEvent | FlowEvent

export interface Flow {
	id: string
	flowRate: string
	lastUpdate: number
	sender: string
	recipient: string
}

export interface GradeEvent {
	id: string
	networkId: ChainName
	transaction: {
		id: string
		timestamp: number
	}
	token: SuperTokenMetadata
	amount: string
}

export interface GradeEvents {
	upgradeEvents: GradeEvent[]
	downgradeEvents: GradeEvent[]
}

export interface AccountToken {
	metadata: SuperTokenMetadata
	events: TokenEvent[]
	flows: Flow[]
	gradeEvents: GradeEvents
}

export interface UserState {
	address: string
	chain: ChainName
	isDark: boolean
	tokens: AccountToken[]
}

// TYPE GUARDS
export function isTransferEvent(event: TokenEvent): event is TransferEvent {
	return event.type === 'transfer'
}

export function isFlowEvent(event: TokenEvent): event is FlowEvent {
	return event.type === 'flow'
}

export function isERC20TokenMetadata(
	token: TokenMetadata
): token is ERC20Metadata {
	return !token.hasOwnProperty('underlyingAddress')
}

export function isSuperTokenMetadata(
	token: TokenMetadata
): token is SuperTokenMetadata {
	return token.hasOwnProperty('underlyingAddress')
}

// OUTPUT

export interface OutputFlow {
	date: number
	start: number
	end: number
	sender: string
	recipient: string
	networkId: ChainName
	txHash: string
	amountToken: string
	amountFiat: string
	exchangeRate: string
	token: SuperTokenMetadata
}

export interface OutputTransfer {
	date: number
	sender: string
	recipient: string
	txHash: string
	networkId: ChainName
	amountToken: string
	amountFiat: string
	exchangeRate: string
	token: TokenMetadata
}
