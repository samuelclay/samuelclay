/**
 * Image Hover Gallery
 * Hover over thumbnails to change the main screenshot image
 */

document.addEventListener('DOMContentLoaded', () => {
    // Find all screenshot galleries
    const galleries = document.querySelectorAll('.screenshot-gallery');

    galleries.forEach(gallery => {
        // Find the parent li element
        const listItem = gallery.closest('li');
        if (!listItem) return;

        // Find the main screenshot image in this list item
        const mainImage = listItem.querySelector('.screenshot');
        if (!mainImage) return;

        // Store the original image source
        const originalSrc = mainImage.src;
        let isHovering = false;

        // Find all thumbnails in this gallery
        const thumbnails = gallery.querySelectorAll('.screenshot-thumb');

        thumbnails.forEach(thumb => {
            // On hover, change the main image
            thumb.addEventListener('mouseenter', () => {
                // Lock height on first hover
                if (!isHovering) {
                    const currentHeight = mainImage.offsetHeight;
                    mainImage.style.height = currentHeight + 'px';
                    isHovering = true;
                }

                const fullSrc = thumb.dataset.fullSrc;
                if (fullSrc) {
                    mainImage.src = fullSrc;
                }
            });

            // On mouse leave from thumbnail, restore original
            thumb.addEventListener('mouseleave', () => {
                mainImage.src = originalSrc;
                // Unlock height
                mainImage.style.height = '';
                isHovering = false;
            });
        });
    });
});
