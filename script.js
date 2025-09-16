document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTS ---
    const track = document.getElementById('image-track');
    const uploadForm = document.getElementById('uploadForm');

    // Login/Upload Modal
    const loginUploadModalEl = document.getElementById('loginUploadModal');
    const loginUploadModal = new bootstrap.Modal(loginUploadModalEl);
    const modalPasswordView = document.getElementById('modal-password-view');
    const modalUploadView = document.getElementById('modal-upload-view');
    const modalUnlockBtn = document.getElementById('modal-unlock-btn');
    const modalPasswordInput = document.getElementById('modal-password-input');
    const modalPasswordError = document.getElementById('modal-password-error');
    const modalFileInfo = document.getElementById('modal-file-info');

    // Detail Modal
    const detailModalEl = document.getElementById('detailModal');
    const detailModal = new bootstrap.Modal(detailModalEl);
    const detailModalLabel = document.getElementById('detailModalLabel');
    const detailModalImage = document.getElementById('detailModalImage');
    const detailModalDescription = document.getElementById('detailModalDescription');
    const deleteBtn = document.getElementById('delete-btn');

    let currentItemId = null;
    let currentItemImage = null;
    let isAdmin = false;
    let uploadJustHappened = false;

    // --- AUTHENTICATION & STATE ---
    function checkLoginState() {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            isAdmin = true;
        }
    }

    function setLoggedIn() {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        modalPasswordView.style.display = 'none';
        modalUploadView.style.display = 'block';
        modalPasswordError.textContent = '';
    }

    // --- LOGIN/UPLOAD MODAL FLOW ---
    loginUploadModalEl.addEventListener('show.bs.modal', () => {
        if (isAdmin) {
            modalPasswordView.style.display = 'none';
            modalUploadView.style.display = 'block';
        }
    });

    modalUnlockBtn.addEventListener('click', () => {
        if (modalPasswordInput.value === '0809') {
            setLoggedIn();
        } else {
            passwordError.textContent = '密碼錯誤!';
        }
    });

    loginUploadModalEl.addEventListener('hidden.bs.modal', () => {
        if (uploadJustHappened) {
            // loadScroller(); // Temporarily disabled for debugging
            uploadJustHappened = false;
        }
        // Reset modal state
        if (!isAdmin) {
            modalPasswordView.style.display = 'block';
            modalUploadView.style.display = 'none';
            modalPasswordInput.value = '';
            modalPasswordError.textContent = '';
        }
        modalFileInfo.innerHTML = '';
        uploadForm.reset();
    });

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        formData.append('password', modalPasswordInput.value);
        modalFileInfo.innerHTML = `<p class="text-info">Uploading...</p>`;
        fetch('/upload', { method: 'POST', body: formData })
            .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || `Error ${status}`);
                modalFileInfo.innerHTML = `<p class="text-success">${data.message}</p>`;
                uploadJustHappened = true; // Set flag to reload scroller after modal closes
                setTimeout(() => loginUploadModal.hide(), 1000);
            })
            .catch(err => modalFileInfo.innerHTML = `<p class="text-danger">${err.message}</p>`);
    });

    // --- SCROLLER & DETAIL MODAL LOGIC ---
    function loadScroller() {
        fetch('/files').then(res => res.json()).then(entries => {
            track.innerHTML = '';
            track.style.animation = 'none';
            if (entries.length === 0) {
                track.innerHTML = '<p class="text-center p-5">No items uploaded yet.</p>';
                return;
            }
            const allEntries = [...entries, ...entries];
            allEntries.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'scroller-item';
                item.innerHTML = `
                    <img src="upload/${entry.image}" class="scroller-image" alt="${entry.title}" 
                         data-bs-toggle="modal" data-bs-target="#detailModal"
                         data-id="${entry.id}" data-image="${entry.image}"
                         data-title="${entry.title}" data-description="${entry.description}">
                    <h6 class="mt-2">${entry.title}</h6>
                `;
                track.appendChild(item);
            });
            setTimeout(() => {
                const animationDuration = entries.length * 12;
                track.style.animation = `scroll ${animationDuration}s linear infinite`;
            }, 10);
        });
    }

    detailModalEl.addEventListener('show.bs.modal', function (event) {
        const imageEl = event.relatedTarget;
        currentItemId = parseInt(imageEl.getAttribute('data-id'));
        currentItemImage = imageEl.getAttribute('data-image');
        detailModalLabel.textContent = imageEl.getAttribute('data-title');
        detailModalImage.src = `upload/${currentItemImage}`;
        detailModalDescription.textContent = imageEl.getAttribute('data-description');
        if (isAdmin) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }
    });

    // --- DELETE LOGIC ---
    deleteBtn.addEventListener('click', () => {
        if (!currentItemId) return;
        fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentItemId, image: currentItemImage, password: '0809' })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) throw new Error(data.error);
            alert(data.message);
            detailModal.hide();
            loadScroller();
        })
        .catch(err => alert(`刪除失敗: ${err.message}`));
    });

    // --- INITIAL LOAD ---
    checkLoginState();
    loadScroller();
});