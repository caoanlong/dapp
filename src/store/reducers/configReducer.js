
import { 
    SET_CHAIN
} from "../constants"


const initState = {
    chain: 'ethereum'
}

const reducer = (state = initState, action) => {
    switch (action.type) {
        case SET_CHAIN:
            return { ...state, chain: action.payload }
        default:
            return state
    }
}

export default reducer