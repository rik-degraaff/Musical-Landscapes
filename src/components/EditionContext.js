import {createContext,useContext} from 'react';
import {FULL_EDITION} from '../utils/editions.js';

export const EditionContext=createContext(FULL_EDITION);
export const useEdition=()=>useContext(EditionContext);
