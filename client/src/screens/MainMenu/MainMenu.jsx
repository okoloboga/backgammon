import { useState } from 'react';
import PropTypes from 'prop-types';
import ProfileCard from './components/ProfileCard';
import ActionButtons from './components/ActionButtons';
import RoomList from './components/RoomList';
import TonConnectButton from './components/TonConnectButton';
import CreateRoomModal from './components/CreateRoomModal';
import { useWalletBalances } from '../../hooks/useWalletBalances';
import '../../styles/MainMenu.css';

const MainMenu = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ton, ruble, loading: balancesLoading, error: balancesError } = useWalletBalances();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="main-menu">
      <div className={`container ${isModalOpen ? 'blur-background' : ''}`}>
        <div className="menu-content">
          <div className="flex justify-center">
            <TonConnectButton />
          </div>
          <ProfileCard user={user} balances={{ ton, ruble, loading: balancesLoading, error: balancesError }} />
          <ActionButtons onCreateGame={handleOpenModal} />
          <RoomList />
        </div>
      </div>

      <CreateRoomModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        balances={{ ton, ruble, loading: balancesLoading }}
      />
    </div>
  );
};

MainMenu.propTypes = {
  user: PropTypes.object,
};

export default MainMenu;