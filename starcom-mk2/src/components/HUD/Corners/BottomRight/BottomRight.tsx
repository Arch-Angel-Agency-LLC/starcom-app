import React, { useState } from 'react';
import styles from './BottomRight.module.css';
import { IntelReport } from '../../../../models/IntelReport';

const BottomRight: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    lat: '',
    long: '',
    title: '',
    subtitle: '',
    date: '',
    author: '',
    content: '',
    tags: '',
    categories: '',
    metaDescription: '',
  });

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newIntelReport = new IntelReport(
      parseFloat(formData.lat),
      parseFloat(formData.long),
      formData.title,
      formData.subtitle,
      formData.date,
      formData.author,
      formData.content,
      formData.tags.split(',').map((tag) => tag.trim()),
      formData.categories.split(',').map((category) => category.trim()),
      formData.metaDescription
    );
    console.log('Intel Report Submitted:', newIntelReport);
    handleClosePopup();
  };

  return (
    <div className={styles.bottomRight}>
      <button className={styles.createButton} onClick={handleOpenPopup}>
        Create Intel Report
      </button>

      {isPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h2>Create Intel Report</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="lat"
                placeholder="Latitude"
                value={formData.lat}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="long"
                placeholder="Longitude"
                value={formData.long}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="subtitle"
                placeholder="Subtitle"
                value={formData.subtitle}
                onChange={handleChange}
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={formData.author}
                onChange={handleChange}
                required
              />
              <textarea
                name="content"
                placeholder="Content"
                value={formData.content}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="tags"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={handleChange}
              />
              <input
                type="text"
                name="categories"
                placeholder="Categories (comma-separated)"
                value={formData.categories}
                onChange={handleChange}
              />
              <textarea
                name="metaDescription"
                placeholder="Meta Description"
                value={formData.metaDescription}
                onChange={handleChange}
              />
              <button type="submit">Submit</button>
              <button type="button" onClick={handleClosePopup}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomRight;