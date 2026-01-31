import { BillProvider } from './context/BillContext';
import SplitScreen from './components/Layout/SplitScreen';

function App() {
    return (
        <BillProvider>
            <div className="h-[100dvh] w-screen overflow-hidden bg-background-dark text-white">
                <SplitScreen />
            </div>
        </BillProvider>
    );
}

export default App;
