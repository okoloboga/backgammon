import { useState } from 'react';
import PropTypes from 'prop-types';
import ProfileCard from './components/ProfileCard';
import ActionButtons from './components/ActionButtons';
import RoomList from './components/RoomList';
import TonConnectButton from './components/TonConnectButton';
import CreateRoomModal from './components/CreateRoomModal';
import '../../styles/MainMenu.css';

const MainMenu = ({ isAuthenticated, onAuthChange, isLoading, error }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <TonConnectButton
              isAuthenticated={isAuthenticated}
              onAuthChange={onAuthChange}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <ProfileCard />
          <ActionButtons onCreateGame={handleOpenModal} />
          <RoomList />
        </div>
      </div>

      <CreateRoomModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

MainMenu.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onAuthChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default MainMenu;