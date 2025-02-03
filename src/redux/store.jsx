import { createStore } from 'redux';
import expenseReducer from './expenseReducer';

const store = createStore(expenseReducer);

export default store;