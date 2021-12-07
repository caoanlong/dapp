export const formatBalance = (balance, num=6) => {
    balance = Number(balance)
    return parseFloat(balance.toFixed(num))
}