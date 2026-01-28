import { BillProvider } from './context/BillContext';
import SplitScreen from './components/Layout/SplitScreen';

function App() {
    return (
        <BillProvider>
            <SplitScreen />
        </BillProvider>
    );
}

export default App;
