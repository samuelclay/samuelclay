/**
 * Image Hover Gallery
 * Hover over thumbnails to display large overlay on right side
 */

document.addEventListener('DOMContentLoaded', () => {
    // Find all screenshot galleries
    const galleries = document.querySelectorAll('.screenshot-gallery');

    galleries.forEach(gallery => {
        // Find the parent li element
        const listItem = gallery.closest('li');
        if (!listItem) return;

        // Create overlay element once for this list item
        const overlay = document.createElement('div');
        overlay.className = 'screenshot-hover-overlay';
        const overlayImg = document.createElement('img');
        overlay.appendChild(overlayImg);
        listItem.appendChild(overlay);

        // Find all thumbnails in this gallery
        const thumbnails = gallery.querySelectorAll('.screenshot-thumb');

        // Preload all images for instant display
        thumbnails.forEach(thumb => {
            const fullSrc = thumb.dataset.fullSrc;
            if (fullSrc) {
                const preloadImg = new Image();
                preloadImg.src = fullSrc;
            }
        });

        thumbnails.forEach(thumb => {
            // On hover, show the overlay with the full-size image
            thumb.addEventListener('mouseenter', () => {
                const fullSrc = thumb.dataset.fullSrc;
                if (fullSrc) {
                    overlayImg.src = fullSrc;
                    overlay.classList.add('visible');
                }
            });

            // On mouse leave from thumbnail, hide overlay
            thumb.addEventListener('mouseleave', () => {
                overlay.classList.remove('visible');
            });
        });
    });
});
