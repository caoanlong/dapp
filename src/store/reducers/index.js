import { combineReducers } from 'redux'
import configReducer from './configReducer'

const reducers = combineReducers({
    config: configReducer
})

export default reducers