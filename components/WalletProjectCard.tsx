import Image from 'next/image';
import styles from '../styles/AllTxs.module.css'

const WalletProjectCard = ({ project, logoUrl, onSelectProject }: any) => {
  const { project_name } = project;
  return (
    <div
      className={styles.walletProjectCard}
      onClick={() => onSelectProject(project)}
      style={{ cursor: 'pointer' }}
    >
      <Image
        src={logoUrl}
        alt={project_name}
        width={100}
        height={100}
        style={{ objectFit: 'contain' }}
      />
      <h3>{project_name}</h3>
    </div>
  );
};

export default WalletProjectCard;