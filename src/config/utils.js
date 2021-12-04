export const formatBalance = (tronWeb, balance) => {
    return tronWeb.fromSun(balance)
}