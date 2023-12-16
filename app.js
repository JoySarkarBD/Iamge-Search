// Constants for Pixabay API
const PIXABAY_API_KEY = "41286685-492108aefcd3e1a612fc201ce";
const PIXABAY_API_URL = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&image_type=photo&per_page=30&category=people&orientation=horizontal&q=`;

// Function to display the search dialog
function showSearchDialog() {
  document.getElementById("searchDialog").showModal();
}

// Function to close a dialog by its ID
function closeDialog(dialogId) {
  document.getElementById(dialogId).close();
}

// Function to search for images using Pixabay API
async function searchImages() {
  const keyword = document.getElementById("keyword").value;
  const response = await fetch(
    `${PIXABAY_API_URL}${encodeURIComponent(keyword)}`
  );
  const data = await response.json();

  // Elements for displaying search results
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsMessage = document.getElementById("result-msg");
  const resultKeyword = document.getElementById("result-keyword");

  // Clear previous results
  resultsMessage.textContent = "";
  const imagesContainer = document.getElementById("image-grid");
  imagesContainer.innerHTML = "";

  // Elements for displaying saved images
  const savedImagesContainer = document.getElementById("savedImagesContainer");

  if (data.hits.length > 0) {
    // Display search results and hide saved images
    resultsContainer.style.display = "block";
    savedImagesContainer.style.display = "none";
    resultsMessage.textContent = `Results of ${keyword}.`;
    resultKeyword.appendChild(resultsMessage);

    // Display each image in the search results
    data.hits.forEach((image) => {
      const imgElement = document.createElement("img");
      imgElement.src = image.webformatURL;
      imgElement.classList.add(
        "block",
        "h-20",
        "w-auto",
        "rounded",
        "cursor-pointer"
      );
      imgElement.addEventListener("click", () =>
        showLargeImage(image.largeImageURL)
      );
      imagesContainer.appendChild(imgElement);
    });

    // Close other dialogs if open
    closeDialog("saveImageDialog");
    closeDialog("deleteImageDialog");
  } else {
    // Display message if no images found
    resultsContainer.style.display = "block";
    savedImagesContainer.style.display = "none";
    resultsMessage.textContent = "Results: NO Images Found.";
    resultKeyword.appendChild(resultsMessage);

    // Close other dialogs if open
    closeDialog("saveImageDialog");
    closeDialog("deleteImageDialog");
  }
}

// Function to display saved images
async function showSavedImages() {
  // Elements for displaying saved images
  const savedImagesContainer = document.getElementById("saved-image-grid");
  const savedImgCount = document.getElementById("saved-img-count");
  const savedImgsContainer = document.getElementById("savedImagesContainer");

  savedImgsContainer.style.display = "block";
  savedImagesContainer.innerHTML = ""; // Clear the container
  savedImgCount.innerHTML = ""; // Clear the container

  try {
    // Open the 'imageCache'
    const cache = await caches.open("imageCache");

    // Get all keys (image URLs) from the cache
    const keys = await cache.keys();

    if (keys.length > 0) {
      savedImgCount.innerHTML = `<p class='text-gray-200 text-sm font-medium mb-5'>${keys.length} saved images found.</p>`;

      // Display each saved image
      keys.forEach(async (key) => {
        const response = await cache.match(key);
        const imgElement = document.createElement("img");
        imgElement.src = response.url;
        imgElement.classList.add(
          "block",
          "h-20",
          "w-auto",
          "rounded",
          "cursor-pointer"
        );
        imgElement.addEventListener("click", () =>
          showLargeImageToDelete(response.url)
        );
        savedImagesContainer.appendChild(imgElement);
      });

      // Optionally, hide the search results container
      const resultsContainer = document.getElementById("resultsContainer");
      resultsContainer.style.display = "none";
    } else {
      const resultsContainer = document.getElementById("resultsContainer");
      resultsContainer.style.display = "none";
      // Optionally, display a message if no saved images
      savedImgCount.innerHTML =
        "<p class='text-gray-200 text-sm font-medium mb-5'>No saved images found.</p>";
    }
  } catch (error) {
    console.error("Error fetching saved images:", error);
  }
}

// Function to display a large image for saving
function showLargeImage(imageUrl) {
  document.getElementById("largeImage").src = imageUrl;
  document.getElementById("saveImageDialog").showModal();
}

// Function to display a large image for deletion
function showLargeImageToDelete(imageUrl) {
  document.getElementById("largeImageToDelete").src = imageUrl;
  document.getElementById("deleteImageDialog").showModal();
}

// Function to save an image to the cache
async function saveImage() {
  const imageUrl = document.getElementById("largeImage").src;

  try {
    // Open a cache named 'imageCache'
    const cache = await caches.open("imageCache");

    // Create a new request with the image URL
    const request = new Request(imageUrl);

    // Check if the image is already in the cache
    const response = await cache.match(request);

    if (!response) {
      // If the image is not in the cache, fetch it from the network
      const imageResponse = await fetch(imageUrl);

      // Cache the image
      await cache.put(request, imageResponse);
    }

    // Optionally, notify the user that the image has been saved
    alert("Image saved successfully!");
    closeDialog("saveImageDialog");
  } catch (error) {
    console.error("Error saving image:", error);
  }
}

// Function to delete an image from the cache
async function deleteImage() {
  const imageUrl = document.getElementById("largeImageToDelete").src;

  // Remove the image from the UI
  const deleteImageDialog = document.getElementById("deleteImageDialog");
  deleteImageDialog.close(); // Close the dialog

  // Find and remove the image element from the UI
  const imagesContainer = document.getElementById("saved-image-grid");
  const imageElements = imagesContainer.getElementsByTagName("img");

  for (let i = 0; i < imageElements.length; i++) {
    if (imageElements[i].src === imageUrl) {
      const imageParent = imageElements[i].parentElement;
      imageParent.removeChild(imageElements[i]);
      break;
    }
  }

  // Remove the image from the cache and update the count
  const isImageDeleted = await removeFromCache(imageUrl);
  if (isImageDeleted) {
    updateSavedImageCount();
  }
}

// Function to remove an image from the cache
async function removeFromCache(imageUrl) {
  try {
    // Open the 'imageCache'
    const cache = await caches.open("imageCache");

    // Create a new request with the image URL
    const request = new Request(imageUrl);

    // Delete the image from the cache
    await cache.delete(request);

    // Return true indicating successful deletion
    return true;
  } catch (error) {
    console.error("Error deleting image from cache:", error);
    // Return false indicating failure
    return false;
  }
}

// Function to update the saved image count
async function updateSavedImageCount() {
  const savedImgCount = document.getElementById("saved-img-count");
  const cache = await caches.open("imageCache");
  const keys = await cache.keys();
  savedImgCount.innerHTML = `<p class='text-gray-200 text-sm font-medium mb-5'>${
    keys.length > 0 ? keys.length : "No"
  } saved images found.</p>`;
}
