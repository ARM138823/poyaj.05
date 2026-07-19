// ============================================================
//  داده‌ها (همه خالی شروع می‌شوند)
// ============================================================
let inventory = [];
let files = [];
let categories = [];

let currentPage = 1;
const perPage = 10;
let filteredData = [];
let deleteTarget = null;
let deleteType = 'product';

// ============================================================
//  تبدیل خودکار به حروف بزرگ (فقط حروف انگلیسی)
// ============================================================
function autoUpperCase(input) {
    if (/[a-zA-Z]/.test(input.value)) {
        input.value = input.value.toUpperCase();
    }
}

// ============================================================
//  فیلدهای شرطی (دینامیک) بر اساس دسته‌بندی
// ============================================================
function updateDynamicFields() {
    const cat = document.getElementById('catInput').value.trim();
    const container = document.getElementById('dynamicFields');
    container.innerHTML = '';

    if (cat === 'دوربین' || cat === 'دزدگیر') {
        // فقط شماره سریال
        container.innerHTML = `
            <div class="col-md-3">
                <label class="form-label fw-bold">شماره سریال</label>
                <input type="text" class="form-control form-control-lg" id="serialNumberInput" oninput="autoUpperCase(this)">
            </div>
        `;
    } else if (cat === 'هارد') {
        // فقط عمر و حجم (بدون واحد)
        container.innerHTML = `
            <div class="col-md-3">
                <label class="form-label fw-bold">عمر</label>
                <input type="number" class="form-control form-control-lg" id="lifeInput" min="0">
            </div>
            <div class="col-md-3">
                <label class="form-label fw-bold">حجم</label>
                <input type="number" class="form-control form-control-lg" id="volumeInput" min="0" step="0.1">
            </div>
        `;
    }
    // برای سایر دسته‌بندی‌ها هیچ فیلدی اضافه نمی‌شود
}

// همچنین هنگام ویرایش، فیلدهای شرطی را نمایش بده
function updateEditDynamicFields(category) {
    const container = document.getElementById('editDynamicFields');
    container.innerHTML = '';

    if (category === 'دوربین' || category === 'دزدگیر') {
        container.innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-bold">شماره سریال</label>
                <input type="text" class="form-control" id="editSerialNumber" oninput="autoUpperCase(this)">
            </div>
        `;
    } else if (category === 'هارد') {
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label fw-bold">عمر</label>
                    <input type="number" class="form-control" id="editLife" min="0">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">حجم</label>
                    <input type="number" class="form-control" id="editVolume" min="0" step="0.1">
                </div>
            </div>
        `;
    }
}

// ============================================================
//  پیشنهادات دسته‌بندی (اتوکامپلیت)
// ============================================================
function showCategorySuggestions() {
    const input = document.getElementById('catInput');
    const val = input.value.trim();
    const list = document.getElementById('autocomplete-list');
    if (!val) { list.style.display = 'none'; return; }
    const filtered = categories.filter(c => c.includes(val));
    if (filtered.length === 0) { list.style.display = 'none'; return; }
    list.innerHTML = filtered.map(c => `<div onclick="selectCategory('${c}')">${c}</div>`).join('');
    list.style.display = 'block';
}

function selectCategory(val) {
    document.getElementById('catInput').value = val;
    document.getElementById('autocomplete-list').style.display = 'none';
    updateDynamicFields(); // به‌روزرسانی فیلدهای شرطی
}

// بستن لیست با کلیک بیرون
document.addEventListener('click', function(e) {
    if (!e.target.closest('.position-relative') || e.target.id !== 'catInput') {
        document.getElementById('autocomplete-list').style.display = 'none';
    }
    if (!e.target.closest('.position-relative') || e.target.id !== 'brandInput') {
        document.getElementById('brand-suggestions').style.display = 'none';
    }
    if (!e.target.closest('.position-relative') || e.target.id !== 'modelInput') {
        document.getElementById('model-suggestions').style.display = 'none';
    }
});

// ============================================================
//  پیشنهادات هوشمند برند و مدل بر اساس دسته‌بندی
// ============================================================
function getBrandSuggestions() {
    const cat = document.getElementById('catInput').value.trim();
    if (!cat) return [];
    const brands = [...new Set(inventory.filter(item => item.category === cat).map(item => item.brand))];
    return brands.filter(b => b); // حذف مقادیر خالی
}

function getModelSuggestions() {
    const cat = document.getElementById('catInput').value.trim();
    if (!cat) return [];
    const models = [...new Set(inventory.filter(item => item.category === cat).map(item => item.model))];
    return models.filter(m => m);
}

function showBrandSuggestions() {
    const input = document.getElementById('brandInput');
    const val = input.value.trim().toUpperCase();
    const suggestions = getBrandSuggestions().filter(b => b.includes(val));
    const container = document.getElementById('brand-suggestions');
    if (!val || suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.innerHTML = suggestions.map(b => `<div onclick="selectBrand('${b}')">${b}</div>`).join('');
    container.style.display = 'block';
}

function selectBrand(brand) {
    document.getElementById('brandInput').value = brand;
    document.getElementById('brand-suggestions').style.display = 'none';
}

function showModelSuggestions() {
    const input = document.getElementById('modelInput');
    const val = input.value.trim().toUpperCase();
    const suggestions = getModelSuggestions().filter(m => m.includes(val));
    const container = document.getElementById('model-suggestions');
    if (!val || suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.innerHTML = suggestions.map(m => `<div onclick="selectModel('${m}')">${m}</div>`).join('');
    container.style.display = 'block';
}

function selectModel(model) {
    document.getElementById('modelInput').value = model;
    document.getElementById('model-suggestions').style.display = 'none';
}

// ============================================================
//  حذف دو مرحله‌ای
// ============================================================
function showDeleteModal(message, targetId, type) {
    deleteTarget = targetId;
    deleteType = type;
    document.getElementById('deleteModalMessage').innerHTML = message;
    new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
}
document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    if (deleteType === 'product') confirmDeleteProduct(deleteTarget);
    else if (deleteType === 'file') confirmDeleteFile(deleteTarget);
    deleteTarget = null;
    deleteType = 'product';
    bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
});

// ============================================================
//  عملیات کالا (با فیلدهای شرطی)
// ============================================================
function deleteProduct(id) {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    showDeleteModal(`آیا از حذف کالا با کد اموال <strong>${item.asset || 'نامشخص'}</strong> مطمئن هستید؟`, id, 'product');
}
function confirmDeleteProduct(id) {
    inventory = inventory.filter(item => item.id !== id);
    renderCategoryTable();
    renderReport();
    updateFilterOptions();
}

function openEditModal(id) {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    document.getElementById('editId').value = item.id;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editBrand').value = item.brand || '';
    document.getElementById('editModel').value = item.model;
    document.getElementById('editShelf').value = item.shelf;
    document.getElementById('editAsset').value = item.asset || '';
    document.getElementById('editProductCode').value = item.productCode || '';

    // نمایش فیلدهای شرطی در ویرایش
    updateEditDynamicFields(item.category);
    // پر کردن مقادیر فیلدهای شرطی
    if (item.category === 'دوربین' || item.category === 'دزدگیر') {
        document.getElementById('editSerialNumber').value = item.serialNumber || '';
    } else if (item.category === 'هارد') {
        document.getElementById('editLife').value = item.life || '';
        document.getElementById('editVolume').value = item.volume || '';
    }

    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function saveEdit() {
    const id = parseInt(document.getElementById('editId').value);
    const category = document.getElementById('editCategory').value.trim();
    const brand = document.getElementById('editBrand').value.trim();
    const model = document.getElementById('editModel').value.trim();
    const shelf = document.getElementById('editShelf').value.trim();
    const asset = document.getElementById('editAsset').value.trim();
    const productCode = document.getElementById('editProductCode').value.trim();

    // اعتبارسنجی فیلدهای ضروری
    if (!category || !model || !shelf || !productCode) {
        alert('لطفاً تمام فیلدهای ضروری (دسته‌بندی، مدل، کد قفسه، کد محصول) را پر کنید!');
        return;
    }
    if (asset && inventory.some(item => item.asset === asset && item.id !== id)) {
        alert('کد اموال تکراری است!');
        return;
    }

    const item = inventory.find(p => p.id === id);
    if (!item) return;
    item.category = category;
    item.brand = brand || '';
    item.model = model;
    item.shelf = shelf;
    item.asset = asset || '';
    item.productCode = productCode;

    // ذخیره فیلدهای شرطی
    if (category === 'دوربین' || category === 'دزدگیر') {
        item.serialNumber = document.getElementById('editSerialNumber').value.trim() || '';
        delete item.life;
        delete item.volume;
    } else if (category === 'هارد') {
        item.life = document.getElementById('editLife').value.trim() || '';
        item.volume = document.getElementById('editVolume').value.trim() || '';
        delete item.serialNumber;
    } else {
        delete item.serialNumber;
        delete item.life;
        delete item.volume;
    }

    if (!categories.includes(category)) categories.push(category);

    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    renderCategoryTable();
    renderReport();
    updateFilterOptions();
}

function addProduct() {
    const cat = document.getElementById('catInput').value.trim();
    const brand = document.getElementById('brandInput').value.trim();
    const model = document.getElementById('modelInput').value.trim();
    const shelf = document.getElementById('shelfInput').value.trim();
    const asset = document.getElementById('assetInput').value.trim();
    const productCode = document.getElementById('productCodeInput').value.trim();

    // اعتبارسنجی فیلدهای ضروری
    if (!cat || !model || !shelf || !productCode) {
        alert('لطفاً تمام فیلدهای ضروری (دسته‌بندی، مدل، کد قفسه، کد محصول) را پر کنید!');
        return;
    }
    if (asset && inventory.some(item => item.asset === asset)) {
        alert('کد اموال تکراری است!');
        return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const newItem = {
        id: Date.now(),
        category: cat,
        brand: brand || '',
        model: model,
        shelf: shelf,
        asset: asset || '',
        productCode: productCode,
        date: dateStr
    };

    // افزودن فیلدهای شرطی
    if (cat === 'دوربین' || cat === 'دزدگیر') {
        newItem.serialNumber = document.getElementById('serialNumberInput')?.value.trim() || '';
    } else if (cat === 'هارد') {
        newItem.life = document.getElementById('lifeInput')?.value.trim() || '';
        newItem.volume = document.getElementById('volumeInput')?.value.trim() || '';
    }

    inventory.push(newItem);
    if (!categories.includes(cat)) categories.push(cat);

    // پاک کردن فرم
    document.getElementById('catInput').value = '';
    document.getElementById('brandInput').value = '';
    document.getElementById('modelInput').value = '';
    document.getElementById('shelfInput').value = '';
    document.getElementById('assetInput').value = '';
    document.getElementById('productCodeInput').value = '';
    document.getElementById('dynamicFields').innerHTML = '';
    document.getElementById('autocomplete-list').style.display = 'none';
    document.getElementById('brand-suggestions').style.display = 'none';
    document.getElementById('model-suggestions').style.display = 'none';

    renderCategoryTable();
    renderReport();
    updateFilterOptions();
}

// ============================================================
//  گزارش کامل (با نمایش ویژگی‌های اضافی)
// ============================================================
function renderReport() {
    const search = document.getElementById('reportSearch').value.trim().toLowerCase();
    let data = inventory.filter(item =>
        item.category.includes(search) || item.brand.includes(search) ||
        item.model.includes(search) || item.asset.includes(search) ||
        (item.productCode && item.productCode.includes(search))
    );
    const from = document.getElementById('filterDateFrom')?.value;
    const to = document.getElementById('filterDateTo')?.value;
    const catFilter = document.getElementById('filterCategory')?.value;
    if (from) data = data.filter(item => item.date.split(' ')[0] >= from);
    if (to) data = data.filter(item => item.date.split(' ')[0] <= to);
    if (catFilter) data = data.filter(item => item.category === catFilter);
    filteredData = data;

    const groups = {};
    data.forEach(item => {
        const key = `${item.category}||${item.brand}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const groupKeys = Object.keys(groups);
    const totalGroups = groupKeys.length;
    const totalPages = Math.ceil(totalGroups / perPage);
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = groupKeys.slice(start, end);

    const container = document.getElementById('reportContainer');
    if (pageItems.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">موردی برای نمایش یافت نشد.</div>';
        document.querySelector('#paginationContainer ul').innerHTML = '';
        return;
    }

    let html = '';
    pageItems.forEach(key => {
        const [cat, brand] = key.split('||');
        const items = groups[key];
        const total = items.length;
        const models = {};
        items.forEach(it => { models[it.model] = (models[it.model] || 0) + 1; });
        const modelStr = Object.entries(models).map(([m, c]) => `${m} (${c})`).join(' - ');

        html += `
            <div class="group-row" data-group="${key}">
                <div class="d-flex flex-wrap align-items-center justify-content-between">
                    <div>
                        <span class="fw-bold fs-5">${cat}</span>
                        <span class="mx-2 text-secondary">|</span>
                        <span class="text-primary fw-bold">${brand || 'بدون برند'}</span>
                        <span class="badge bg-light text-dark mx-2">${modelStr}</span>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge-count">${total} عدد</span>
                        <button class="btn-expand" onclick="toggleDetail('${key}')" id="btn-${key}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                <div class="detail-row" id="detail-${key}">
                    <table class="table table-sm table-bordered mb-0 bg-white rounded">
                        <thead class="table-secondary">
                            <tr><th>مدل</th><th>کد قفسه</th><th>کد اموال</th><th>کد محصول</th><th>ویژگی‌ها</th><th>تاریخ و ساعت</th><th>عملیات</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(it => {
                                let extra = '';
                                if (it.category === 'دوربین' || it.category === 'دزدگیر') {
                                    extra = `شماره سریال: ${it.serialNumber || '-'}`;
                                } else if (it.category === 'هارد') {
                                    extra = `عمر: ${it.life || '-'}، حجم: ${it.volume || '-'}`;
                                } else {
                                    extra = '-';
                                }
                                return `
                                    <tr>
                                        <td>${it.model}</td>
                                        <td>${it.shelf}</td>
                                        <td><code>${it.asset || '-'}</code></td>
                                        <td>${it.productCode}</td>
                                        <td>${extra}</td>
                                        <td>${it.date}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${it.id})"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${it.id})"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    const pagUl = document.querySelector('#paginationContainer ul');
    pagUl.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        pagUl.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
        </li>`;
    }
}

function changePage(page) { currentPage = page; renderReport(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function toggleDetail(key) {
    const detail = document.getElementById(`detail-${key}`);
    const btn = document.getElementById(`btn-${key}`);
    detail.classList.toggle('show');
    btn.classList.toggle('expanded');
}
function applyFilter() { currentPage = 1; renderReport(); }

function exportCategoryExcel() {
    const data = inventory.map(item => ({
        'دسته‌بندی': item.category, 'برند': item.brand || '', 'مدل': item.model,
        'کد قفسه': item.shelf, 'کد اموال': item.asset || '', 'کد محصول': item.productCode,
        'شماره سریال': item.serialNumber || '', 'عمر': item.life || '', 'حجم': item.volume || '',
        'تاریخ ثبت': item.date
    }));
    downloadExcel(data, 'دسته_بندی_اجناس');
}
function exportReportExcel() {
    const data = filteredData.map(item => ({
        'دسته‌بندی': item.category, 'برند': item.brand || '', 'مدل': item.model,
        'کد قفسه': item.shelf, 'کد اموال': item.asset || '', 'کد محصول': item.productCode,
        'شماره سریال': item.serialNumber || '', 'عمر': item.life || '', 'حجم': item.volume || '',
        'تاریخ ثبت': item.date
    }));
    downloadExcel(data, 'گزارش_کامل');
}

// ============================================================
//  مدیریت فایل‌ها (بدون تغییر)
// ============================================================
function renderFiles() {
    const search = document.getElementById('fileSearch').value.trim().toLowerCase();
    const dateFilter = document.getElementById('fileDateFilter').value;
    const catFilter = document.getElementById('fileCategoryFilter').value;
    let filtered = files.filter(f => {
        let match = true;
        if (search && !f.name.includes(search) && !f.desc.includes(search)) match = false;
        if (dateFilter && f.date !== dateFilter) match = false;
        if (catFilter && f.category !== catFilter) match = false;
        return match;
    });
    const container = document.getElementById('filesContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">هیچ فایلی با این شرایط یافت نشد.</div>';
        return;
    }
    container.innerHTML = filtered.map(f => `
        <div class="file-item">
            <div>
                <i class="fas fa-file-pdf text-danger me-2 fs-4"></i>
                <strong>${f.name}</strong>
                <span class="badge bg-rosegold bg-opacity-10 text-rosegold mx-2">${f.category}</span>
                <small class="text-muted">${f.date}</small>
                <p class="text-muted small mb-0">${f.desc}</p>
            </div>
            <div class="file-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="openEditFileModal(${f.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFile(${f.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}
function deleteFile(id) {
    const file = files.find(f => f.id === id);
    if (!file) return;
    showDeleteModal(`آیا از حذف فایل <strong>${file.name}</strong> مطمئن هستید؟`, id, 'file');
}
function confirmDeleteFile(id) {
    files = files.filter(f => f.id !== id);
    renderFiles();
    updateFilterOptions();
}
function openEditFileModal(id) {
    const file = files.find(f => f.id === id);
    if (!file) return;
    document.getElementById('editFileId').value = file.id;
    document.getElementById('editFileName').value = file.name;
    document.getElementById('editFileDate').value = file.date;
    document.getElementById('editFileDesc').value = file.desc;
    const catSelect = document.getElementById('editFileCategory');
    const currentCats = [...new Set(inventory.map(i => i.category))];
    catSelect.innerHTML = '';
    currentCats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        if (c === file.category) opt.selected = true;
        catSelect.appendChild(opt);
    });
    new bootstrap.Modal(document.getElementById('editFileModal')).show();
}
function saveFileEdit() {
    const id = parseInt(document.getElementById('editFileId').value);
    const name = document.getElementById('editFileName').value.trim();
    const category = document.getElementById('editFileCategory').value;
    const date = document.getElementById('editFileDate').value;
    const desc = document.getElementById('editFileDesc').value.trim();
    if (!name || !category || !date) { alert('لطفاً تمام فیلدهای اجباری را پر کنید!'); return; }
    const file = files.find(f => f.id === id);
    if (!file) return;
    file.name = name;
    file.category = category;
    file.date = date;
    file.desc = desc || '';
    bootstrap.Modal.getInstance(document.getElementById('editFileModal')).hide();
    renderFiles();
    updateFilterOptions();
}
function addMockFile() {
    const now = new Date().toISOString().split('T')[0];
    const cats = [...new Set(inventory.map(i => i.category))];
    const randomCat = cats.length ? cats[Math.floor(Math.random() * cats.length)] : 'دوربین';
    files.push({
        id: Date.now(),
        name: `سند_${Math.floor(Math.random()*1000)}.pdf`,
        category: randomCat,
        date: now,
        desc: 'آپلود دستی'
    });
    renderFiles();
    updateFilterOptions();
}
function exportFilesExcel() {
    const data = files.map(f => ({
        'نام فایل': f.name, 'دسته‌بندی': f.category, 'تاریخ': f.date, 'توضیحات': f.desc
    }));
    downloadExcel(data, 'لیست_فایل‌ها');
}

// ============================================================
//  توابع کمکی
// ============================================================
function downloadExcel(data, filename) {
    if (data.length === 0) { alert('داده‌ای برای خروجی وجود ندارد!'); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}
function updateFilterOptions() {
    const cats = [...new Set(inventory.map(i => i.category))];
    ['filterCategory', 'fileCategoryFilter'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '<option value="">همه</option>';
        cats.forEach(c => {
            sel.innerHTML += `<option value="${c}">${c}</option>`;
        });
        sel.value = current;
    });
}
function renderCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = '';
    inventory.forEach(item => {
        let extra = '';
        if (item.category === 'دوربین' || item.category === 'دزدگیر') {
            extra = `شماره سریال: ${item.serialNumber || '-'}`;
        } else if (item.category === 'هارد') {
            extra = `عمر: ${item.life || '-'}، حجم: ${item.volume || '-'}`;
        } else {
            extra = '-';
        }

        tbody.innerHTML += `
            <tr>
                <td><span class="badge bg-success bg-opacity-10 text-success">${item.category}</span></td>
                <td>${item.brand || '-'}</td>
                <td>${item.model}</td>
                <td>${item.shelf}</td>
                <td><code>${item.asset || '-'}</code></td>
                <td>${item.productCode}</td>
                <td>${extra}</td>
                <td>${item.date}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    updateFilterOptions();
}

// ============================================================
//  افکت سه‌بعدی
// ============================================================
document.querySelectorAll('.card-3d').forEach(card => {
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        this.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        this.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        this.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
});

// ============================================================
//  مقداردهی اولیه
// ============================================================
function init() {
    renderCategoryTable();
    renderReport();
    renderFiles();
    updateFilterOptions();
    document.querySelectorAll('#mainTabs .nav-link').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#mainTabs .nav-link').forEach(b => {
                b.classList.remove('active-tab-green', 'active-tab-blue', 'active-tab-rose');
            });
            if (this.id === 'tab-category') this.classList.add('active-tab-green');
            else if (this.id === 'tab-report') this.classList.add('active-tab-blue');
            else if (this.id === 'tab-files') this.classList.add('active-tab-rose');
        });
    });
}
document.addEventListener('DOMContentLoaded', init);
