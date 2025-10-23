import Impressum from '../Impressum.jsx';
import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function ImpressumPortal() {
  const {
    impressum: { visible, close }
  } = usePublicApp();

  if (!visible) {
    return null;
  }

  return <Impressum onClose={close} />;
}
