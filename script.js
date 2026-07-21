// ============================================================
//  داده‌ها
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
//  تاریخ و ساعت شمسی (بالای صفحه)
// ============================================================
function updateDateTime() {
    const now = moment().locale('fa');
    document.getElementById('currentDateTime').innerHTML = 
        `<i class="far fa-clock me-1"></i> ${now.format('jYYYY/jMM/jDD HH:mm:ss')}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ============================================================
//  تبدیل تاریخ میلادی به شمسی
// ============================================================
function toJalali(dateStr) {
    if (!dateStr) return '-';
    const m = moment(dateStr, 'YYYY-MM-DD HH:mm');
    if (!m.isValid()) return dateStr;
    return m.locale('fa').format('jYYYY/jMM/jDD HH:mm');
}

function toJalaliDate(dateStr) {
    if (!dateStr) return '-';
    const m = moment(dateStr, 'YYYY-MM-DD');
    if (!m.isValid()) return dateStr;
    return m.locale('fa').format('jYYYY/jMM/jDD');
}

// ============================================================
//  تبدیل تاریخ شمسی به میلادی (برای فیلتر)
// ============================================================
function jalaliToGregorian(jalaliStr) {
    if (!jalaliStr) return null;
    try {
        const parts = jalaliStr.split('/');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        
        const pDate = new persianDate([year, month, day]);
        const gregorian = pDate.toDate();
        return gregorian.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

// ============================================================
//  تبدیل خودکار به حروف بزرگ
// ============================================================
function autoUpperCase(input) {
    if (/[a-zA-Z]/.test(input.value)) {
        input.value = input.value.toUpperCase();
    }
}

// ============================================================
//  فیلدهای شرطی (دینامیک)
// ============================================================
function updateDynamicFields() {
    const cat = document.getElementById('catInput').value.trim();
    const container = document.getElementById('dynamicFields');
    container.innerHTML = '';

    if (cat === 'دوربین' || cat === 'دزدگیر') {
        container.innerHTML = `
            <div class="col-md-3">
                <label class="form-label fw-bold">شماره سریال</label>
                <input type="text" class="form-control form-control-lg" id="serialNumberInput" oninput="autoUpperCase(this)">
            </div>
        `;
    } else if (cat === 'هارد') {
        container.innerHTML = `
            <div class="col-md-3 health-percent health-percent-lg">
                <label class="form-label fw-bold">سلامت (%)</label>
                <input type="number" class="form-control form-control-lg" id="healthInput" min="0" max="100">
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">حجم</label>
                <div class="volume-input-group volume-input-group-lg">
                    <select class="unit-selector" id="volumeUnitInput">
                        <option value="GB">GB</option>
                        <option value="TB">TB</option>
                    </select>
                    <input type="number" class="form-control form-control-lg" id="volumeValueInput" min="0" step="0.1">
                </div>
            </div>
        `;
    }
}

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
                <div class="col-md-6 health-percent">
                    <label class="form-label fw-bold">سلامت (%)</label>
                    <input type="number" class="form-control" id="editHealth" min="0" max="100">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">حجم</label>
                    <div class="volume-input-group">
                        <select class="unit-selector" id="editVolumeUnit">
                            <option value="GB">GB</option>
                            <option value="TB">TB</option>
                        </select>
                        <input type="number" class="form-control" id="editVolumeValue" min="0" step="0.1">
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================================
//  پیشنهادات دسته‌بندی
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
    updateDynamicFields();
}

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
//  پیشنهادات هوشمند برند و مدل
// ============================================================
function getBrandSuggestions() {
    const cat = document.getElementById('catInput').value.trim();
    if (!cat) return [];
    const brands = [...new Set(inventory.filter(item => item.category === cat).map(item => item.brand))];
    return brands.filter(b => b);
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
    if (!val || suggestions.length === 0) { container.style.display = 'none'; return; }
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
    if (!val || suggestions.length === 0) { container.style.display = 'none'; return; }
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
//  عملیات کالا
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

    updateEditDynamicFields(item.category);

    if (item.category === 'دوربین' || item.category === 'دزدگیر') {
        document.getElementById('editSerialNumber').value = item.serialNumber || '';
    } else if (item.category === 'هارد') {
        document.getElementById('editHealth').value = item.health || '';
        document.getElementById('editVolumeValue').value = item.volumeValue || '';
        document.getElementById('editVolumeUnit').value = item.volumeUnit || 'GB';
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

    if (category === 'دوربین' || category === 'دزدگیر') {
        item.serialNumber = document.getElementById('editSerialNumber').value.trim() || '';
        delete item.health;
        delete item.volumeValue;
        delete item.volumeUnit;
    } else if (category === 'هارد') {
        item.health = document.getElementById('editHealth').value.trim() || '';
        item.volumeValue = document.getElementById('editVolumeValue').value.trim() || '';
        item.volumeUnit = document.getElementById('editVolumeUnit').value || 'GB';
        delete item.serialNumber;
    } else {
        delete item.serialNumber;
        delete item.health;
        delete item.volumeValue;
        delete item.volumeUnit;
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

    if (cat === 'دوربین' || cat === 'دزدگیر') {
        newItem.serialNumber = document.getElementById('serialNumberInput')?.value.trim() || '';
    } else if (cat === 'هارد') {
        newItem.health = document.getElementById('healthInput')?.value.trim() || '';
        newItem.volumeValue = document.getElementById('volumeValueInput')?.value.trim() || '';
        newItem.volumeUnit = document.getElementById('volumeUnitInput')?.value || 'GB';
    }

    inventory.push(newItem);
    if (!categories.includes(cat)) categories.push(cat);

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
//  دکمه ثبت فایل (سبز لجنی)
// ============================================================
function addFileFromProduct() {
    const cat = document.getElementById('catInput').value.trim();
    const productCode = document.getElementById('productCodeInput').value.trim();

    if (!cat || !productCode) {
        alert('لطفاً ابتدا دسته‌بندی و کد محصول را وارد کنید!');
        return;
    }

    const now = new Date().toISOString().split('T')[0];
    const fileName = `فایل_${cat}_${productCode || 'بدون کد'}.pdf`;

    files.push({
        id: Date.now(),
        name: fileName,
        category: cat,
        date: now,
        desc: `فایل مرتبط با کالای ${cat} - کد محصول: ${productCode}`
    });

    renderFiles();
    updateFilterOptions();
    alert(`فایل با نام "${fileName}" در بخش فایل‌ها ثبت شد.`);
}

// ============================================================
//  گزارش کامل (با تاریخ شمسی)
// ============================================================
function renderReport() {
    const search = document.getElementById('reportSearch').value.trim().toLowerCase();
    let data = inventory.filter(item =>
        item.category.includes(search) || item.brand.includes(search) ||
        item.model.includes(search) || item.asset.includes(search) ||
        (item.productCode && item.productCode.includes(search))
    );

    // فیلتر تاریخ شمسی
    const fromInput = document.getElementById('filterDateFrom')?.value.trim();
    const toInput = document.getElementById('filterDateTo')?.value.trim();
    const catFilter = document.getElementById('filterCategory')?.value;

    if (fromInput) {
        const gregFrom = jalaliToGregorian(fromInput);
        if (gregFrom) data = data.filter(item => item.date.split(' ')[0] >= gregFrom);
    }
    if (toInput) {
        const gregTo = jalaliToGregorian(toInput);
        if (gregTo) data = data.filter(item => item.date.split(' ')[0] <= gregTo);
    }
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
                                    const health = it.health ? `${it.health}%` : '-';
                                    const volume = (it.volumeValue && it.volumeUnit) ? `${it.volumeValue} ${it.volumeUnit}` : '-';
                                    extra = `سلامت: ${health}، حجم: ${volume}`;
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
                                        <td>${toJalali(it.date)}</td>
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
    const data = inventory.map(item => {
        let health = '';
        let volume = '';
        if (item.category === 'هارد') {
            health = item.health ? `${item.health}%` : '';
            volume = (item.volumeValue && item.volumeUnit) ? `${item.volumeValue} ${item.volumeUnit}` : '';
        }
        return {
            'دسته‌بندی': item.category,
            'برند': item.brand || '',
            'مدل': item.model,
            'کد قفسه': item.shelf,
            'کد اموال': item.asset || '',
            'کد محصول': item.productCode,
            'شماره سریال': (item.category === 'دوربین' || item.category === 'دزدگیر') ? (item.serialNumber || '') : '',
            'سلامت': health,
            'حجم': volume,
            'تاریخ ثبت': toJalali(item.date)
        };
    });
    downloadExcel(data, 'دسته_بندی_اجناس');
}

function exportReportExcel() {
    const data = filteredData.map(item => {
        let health = '';
        let volume = '';
        if (item.category === 'هارد') {
            health = item.health ? `${item.health}%` : '';
            volume = (item.volumeValue && item.volumeUnit) ? `${item.volumeValue} ${item.volumeUnit}` : '';
        }
        return {
            'دسته‌بندی': item.category,
            'برند': item.brand || '',
            'مدل': item.model,
            'کد قفسه': item.shelf,
            'کد اموال': item.asset || '',
            'کد محصول': item.productCode,
            'شماره سریال': (item.category === 'دوربین' || item.category === 'دزدگیر') ? (item.serialNumber || '') : '',
            'سلامت': health,
            'حجم': volume,
            'تاریخ ثبت': toJalali(item.date)
        };
    });
    downloadExcel(data, 'گزارش_کامل');
}

// ============================================================
//  خروجی اکسل با استایل
// ============================================================
function downloadExcel(data, filename) {
    if (data.length === 0) {
        alert('داده‌ای برای خروجی وجود ندارد!');
        return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(h => item[h] || ''));

    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = headers.map(h => ({ wch: Math.max(h.length * 1.5, 15) }));
    ws['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            if (!ws[cellAddress].s) ws[cellAddress].s = {};

            ws[cellAddress].s.alignment = {
                horizontal: 'right',
                vertical: 'center',
                wrapText: true
            };

            if (R === 0) {
                ws[cellAddress].s.font = {
                    bold: true,
                    color: { rgb: "FFFFFF" },
                    size: 12
                };
                ws[cellAddress].s.fill = {
                    patternType: "solid",
                    fgColor: { rgb: "1A7431" }
                };
                ws[cellAddress].s.border = {
                    top: { style: "thin", color: { rgb: "FFFFFF" } },
                    bottom: { style: "thin", color: { rgb: "FFFFFF" } },
                    left: { style: "thin", color: { rgb: "FFFFFF" } },
                    right: { style: "thin", color: { rgb: "FFFFFF" } }
                };
            } else {
                ws[cellAddress].s.fill = {
                    patternType: "solid",
                    fgColor: { rgb: R % 2 === 0 ? "F2F2F2" : "FFFFFF" }
                };
                ws[cellAddress].s.font = { size: 11 };
                ws[cellAddress].s.border = {
                    top: { style: "thin", color: { rgb: "D0D0D0" } },
                    bottom: { style: "thin", color: { rgb: "D0D0D0" } },
                    left: { style: "thin", color: { rgb: "D0D0D0" } },
                    right: { style: "thin", color: { rgb: "D0D0D0" } }
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ============================================================
//  مدیریت فایل‌ها (با تاریخ شمسی)
// ============================================================
function renderFiles() {
    const search = document.getElementById('fileSearch').value.trim().toLowerCase();
    const dateFilter = document.getElementById('fileDateFilter').value.trim();
    const catFilter = document.getElementById('fileCategoryFilter').value;

    let filtered = files.filter(f => {
        let match = true;
        if (search && !f.name.includes(search) && !f.desc.includes(search)) match = false;
        if (catFilter && f.category !== catFilter) match = false;
        
        // فیلتر تاریخ شمسی
        if (dateFilter) {
            const gregDate = jalaliToGregorian(dateFilter);
            if (gregDate && f.date !== gregDate) match = false;
        }
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
                <small class="text-muted">${toJalaliDate(f.date)}</small>
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
    document.getElementById('editFileDate').value = toJalaliDate(file.date);
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
    const dateShamsi = document.getElementById('editFileDate').value.trim();
    const desc = document.getElementById('editFileDesc').value.trim();

    if (!name || !category || !dateShamsi) {
        alert('لطفاً تمام فیلدهای اجباری را پر کنید!');
        return;
    }

    // تبدیل تاریخ شمسی به میلادی
    const gregDate = jalaliToGregorian(dateShamsi);
    if (!gregDate) {
        alert('فرمت تاریخ صحیح نیست! مثال: 1403/01/01');
        return;
    }

    const file = files.find(f => f.id === id);
    if (!file) return;
    file.name = name;
    file.category = category;
    file.date = gregDate;
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
        'نام فایل': f.name,
        'دسته‌بندی': f.category,
        'تاریخ': toJalaliDate(f.date),
        'توضیحات': f.desc
    }));
    downloadExcel(data, 'لیست_فایل‌ها');
}

// ============================================================
//  توابع کمکی
// ============================================================
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
            const health = item.health ? `${item.health}%` : '-';
            const volume = (item.volumeValue && item.volumeUnit) ? `${item.volumeValue} ${item.volumeUnit}` : '-';
            extra = `سلامت: ${health}، حجم: ${volume}`;
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
                <td>${toJalali(item.date)}</td>
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
//  مقداردهی اولیه
// ============================================================
function init() {
    renderCategoryTable();
    renderReport();
    renderFiles();
    updateFilterOptions();
    
    // فعال‌سازی datepicker شمسی برای فیلدهای تاریخ
    if (typeof persianDatepicker !== 'undefined') {
        try {
            // فیلدهای تاریخ در مودال فیلتر
            const options = {
                format: 'YYYY/MM/DD',
                autoClose: true,
                initialValue: false,
                calendar: {
                    persian: {
                        locale: 'fa'
                    }
                }
            };
            persianDatepicker(document.getElementById('filterDateFrom'), options);
            persianDatepicker(document.getElementById('filterDateTo'), options);
            persianDatepicker(document.getElementById('fileDateFilter'), options);
            persianDatepicker(document.getElementById('editFileDate'), options);
        } catch(e) {
            console.log('Persian datepicker not available');
        }
    }
    
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
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        this.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        this.style.transition = 'transform 0.08s ease';
    });
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        this.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
});

document.addEventListener('DOMContentLoaded', init);
