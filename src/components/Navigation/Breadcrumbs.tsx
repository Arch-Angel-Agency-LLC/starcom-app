import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import styles from './Breadcrumbs.module.css';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const params = useParams();

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Globe', path: '/' }];

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Handle specific cases
      if (segment === 'teams' && params.teamId) {
        breadcrumbs.push({ label: 'Teams', path: '/teams' });
        label = `Team: ${params.teamId}`;
      } else if (segment === 'investigations' && params.id) {
        breadcrumbs.push({ label: 'Investigations', path: '/investigations' });
        label = `Investigation: ${params.id}`;
      } else if (segment === 'intel' && params.reportId) {
        breadcrumbs.push({ label: 'Intel', path: '/intel' });
        label = `Report: ${params.reportId}`;
      }
      
      breadcrumbs.push({ label, path });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span className={styles.separator}>›</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className={styles.currentCrumb}>{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className={styles.crumbLink}>
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
