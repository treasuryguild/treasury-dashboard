// GroupCard.tsx
import React from 'react';
import styles from '../styles/GroupCard.module.css';  // Import the module CSS
import Link from 'next/link';

type GroupCardProps = {
  groupName: string;
  logoUrl: string;
  numberOfWallets: number;
};

const GroupCard: React.FC<GroupCardProps> = ({ groupName, logoUrl, numberOfWallets }) => {
    // Default logo URL
    const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO;
  
    return (
        <Link href={`/${encodeURIComponent(groupName)}`} className={styles['group-card']}>
                <div className={styles['group-card-content']}>
                    <img 
                        src={logoUrl || defaultLogoUrl}
                        alt={`${groupName} logo`} 
                        className={styles['group-logo']} 
                    />
                    <h4>{groupName}</h4>
                </div>
        </Link>
    );
};

export default GroupCard;
