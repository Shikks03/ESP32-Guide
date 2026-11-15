import { useAllStatuses } from '../state/progress';
import { useTitle } from '../lib/useTitle';
import { Hero } from './home/Hero';
import { Bench } from './home/Bench';
import { MeetBoard } from './home/MeetBoard';
import { AllLabs } from './home/AllLabs';
import './HomePage.css';

export default function HomePage() {
  useTitle('Labs');
  const statuses = useAllStatuses();
  return (
    <div className="home">
      <Hero statuses={statuses} />
      <Bench statuses={statuses} />
      <MeetBoard />
      <AllLabs statuses={statuses} />
    </div>
  );
}
