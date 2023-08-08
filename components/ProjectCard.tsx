// ProjectCard.tsx
import React from 'react';
import styles from '../styles/ProjectCard.module.css';  // You'll need to create a new CSS module for this component
import Link from 'next/link';

type ProjectCardProps = {
  projectId: string;
  projectName: string;
  projectType: string;
  logoUrl: string;
  groupName: string;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ projectId, projectName, projectType, logoUrl, groupName }) => {
    return (
        <Link href={`/${groupName}/${projectName}`} className={styles['project-card']}>
            <div className={styles['project-card-content']}>
                <img 
                    src={logoUrl}
                    alt={`${projectName} logo`} 
                    className={styles['project-logo']} 
                />
                <h4>{projectName}</h4>
            </div>
        </Link>
    );
};

export default ProjectCard;
