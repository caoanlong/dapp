import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import reducers from './reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose


const persistConfig = {
    key: '__r__',
    storage
}

const store = createStore(
    persistReducer(persistConfig, reducers), 
    composeEnhancers(applyMiddleware(thunk))
)

export const persistor = persistStore(store)


export default store