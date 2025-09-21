import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProfileCard from './components/ProfileCard';
import ActionButtons from './components/ActionButtons';
import RoomList from './components/RoomList';
import TonConnectButton from './components/TonConnectButton';
import CreateRoomModal from './components/CreateRoomModal';
// import { // analyticsService } from '../../services/// analyticsService';
import '../../styles/MainMenu.css';

const MainMenu = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track screen view when component mounts
  useEffect(() => {
    // analyticsService.trackScreenView('main-menu');
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // analyticsService.trackButtonClick('create_room', 'main-menu');
    // analyticsService.trackEvent('create_room_modal_opened');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // analyticsService.trackEvent('create_room_modal_closed');
  };

  return (
    <div className="main-menu">
      <div className={`container ${isModalOpen ? 'blur-background' : ''}`}>
        <div className="menu-content">
          <div className="flex justify-center">
            <TonConnectButton />
          </div>
          <ProfileCard user={user} />
          <ActionButtons onCreateGame={handleOpenModal} />
          <RoomList />
        </div>
      </div>

      <CreateRoomModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

MainMenu.propTypes = {
  user: PropTypes.object,
};

export default MainMenu;