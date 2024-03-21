import Image from 'next/image';

const WalletProjectCard = ({ project, onSelectProject }: any) => {
  const { project_name, logo_url } = project;

  return (
    <div
      className="project-card"
      onClick={() => onSelectProject(project)}
      style={{ cursor: 'pointer' }}
    >
      <Image
        src={logo_url}
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