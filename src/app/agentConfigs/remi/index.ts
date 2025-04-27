import { injectTransferTools } from '../utils';
import remi_session from './session';

const agents = injectTransferTools([remi_session]);

export default agents;