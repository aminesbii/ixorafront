import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-admin-categories',
    templateUrl: './admin-categories.component.html',
    styleUrls: ['./admin-categories.component.css'],
    standalone: false
})
export class AdminCategoriesComponent implements OnInit {
    categories: Category[] = [];
    loading = false;

    // Add form
    showAddForm = false;
    addName = '';
    addSlug = '';
    addParentId = '';
    addSortOrder = 0;
    addIsActive = true;
    addImageFile: File | null = null;
    addImagePreview: SafeUrl | null = null;
    isSubmitting = false;

    // Edit modal
    editCategory: Category | null = null;
    editName = '';
    editSlug = '';
    editParentId = '';
    editSortOrder = 0;
    editIsActive = true;
    editImageFile: File | null = null;
    editImagePreview: SafeUrl | null = null;
    isEditSubmitting = false;

    // Delete confirm
    confirmDelete: Category | null = null;

    // Assign products modal
    assignCategory: Category | null = null;
    allProducts: Product[] = [];
    assignedProductIds: Set<string> = new Set();
    assignSearchTerm = '';
    isAssignSubmitting = false;
    assignLoading = false;

    // Product sort modal
    sortCategory: Category | null = null;
    sortProducts: Product[] = [];
    sortLoading = false;
    isSortSaving = false;
    showSortModal = false;
    selectedTopIds: Set<string> = new Set();

    // Reorder state
    isReordering = false;

    // Toast
    toastMessage = '';
    toastVisible = false;
    private toastTimer: any = null;

    constructor(
        private categoryService: CategoryService,
        private productService: ProductService,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) clearTimeout(this.toastTimer);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────
    catId(c: Category): string {
        return c.id ?? c._id;
    }

    prodId(p: Product): string {
        return (p.id ?? p._id) as string;
    }

    private showToast(msg: string): void {
        this.toastMessage = msg;
        this.toastVisible = true;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.toastVisible = false;
            this.toastMessage = '';
        }, 4000);
    }

    generateSlug(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // ─── Load ───────────────────────────────────────────────────────────────────
    loadCategories(): void {
        this.loading = true;
        this.categoryService.list().subscribe({
            next: (cats) => {
                this.categories = cats;
                this.loading = false;
            },
            error: () => (this.loading = false)
        });
    }

    // ─── Drag & Drop Reorder ────────────────────────────────────────────────────
    onCategoryDrop(event: CdkDragDrop<Category[]>): void {
        moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
        const ids = this.categories.map(c => this.catId(c));
        this.isReordering = true;
        this.categoryService.reorder(ids).subscribe({
            next: () => {
                this.isReordering = false;
                this.showToast('Categories reordered');
            },
            error: () => {
                this.isReordering = false;
                this.showToast('Failed to reorder categories');
                this.loadCategories();
            }
        });
    }

    // ─── Product Sort Modal ─────────────────────────────────────────────────────
    openSortModal(cat: Category): void {
        this.sortCategory = cat;
        this.sortProducts = [];
        this.selectedTopIds = new Set();
        this.sortLoading = true;
        this.showSortModal = true;
        this.productService.getByCategory(this.catId(cat)).subscribe({
            next: (products) => {
                this.sortProducts = products;
                for (const p of products) {
                    if (p.sort_order != null) {
                        this.selectedTopIds.add(this.prodId(p));
                    }
                }
                this.sortLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.sortLoading = false;
                this.showToast('Failed to load products');
            }
        });
    }

    closeSortModal(): void {
        this.showSortModal = false;
        this.sortCategory = null;
        this.sortProducts = [];
        this.selectedTopIds.clear();
        this.isSortSaving = false;
    }

    get topProducts(): Product[] {
        return this.sortProducts
            .filter(p => this.selectedTopIds.has(this.prodId(p)))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    get restProducts(): Product[] {
        return this.sortProducts.filter(p => !this.selectedTopIds.has(this.prodId(p)));
    }

    get canPinMore(): boolean {
        return this.selectedTopIds.size < 3;
    }

    toggleTopProduct(p: Product): void {
        const id = this.prodId(p);
        if (this.selectedTopIds.has(id)) {
            this.selectedTopIds.delete(id);
        } else {
            if (!this.canPinMore) return;
            this.selectedTopIds.add(id);
        }
        this.saveTopOrder();
    }

    isTopProduct(p: Product): boolean {
        return this.selectedTopIds.has(this.prodId(p));
    }

    onProductDrop(event: CdkDragDrop<Product[]>): void {
        const top = [...this.topProducts];
        moveItemInArray(top, event.previousIndex, event.currentIndex);
        const ids = top.map(p => this.prodId(p));
        this.isSortSaving = true;
        this.productService.reorderInCategory(this.catId(this.sortCategory!), ids).subscribe({
            next: () => {
                this.isSortSaving = false;
                const catId = this.catId(this.sortCategory!);
                this.productService.getByCategory(catId).subscribe({
                    next: (products) => {
                        this.sortProducts = products;
                        this.cdr.detectChanges();
                    }
                });
            },
            error: () => {
                this.isSortSaving = false;
                this.showToast('Failed to reorder products');
            }
        });
    }

    private saveTopOrder(): void {
        this.isSortSaving = true;
        const ids = Array.from(this.selectedTopIds);
        this.productService.reorderInCategory(this.catId(this.sortCategory!), ids).subscribe({
            next: () => {
                this.isSortSaving = false;
                const catId = this.catId(this.sortCategory!);
                this.productService.getByCategory(catId).subscribe({
                    next: (products) => {
                        this.sortProducts = products;
                        this.cdr.detectChanges();
                    }
                });
            },
            error: () => {
                this.isSortSaving = false;
                this.showToast('Failed to save');
            }
        });
    }

    // ─── Add ────────────────────────────────────────────────────────────────────
    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) this.resetAddForm();
    }

    private resetAddForm(): void {
        this.addName = '';
        this.addSlug = '';
        this.addParentId = '';
        this.addSortOrder = 0;
        this.addIsActive = true;
        this.addImageFile = null;
        this.addImagePreview = null;
    }

    onAddNameChange(): void {
        this.addSlug = this.generateSlug(this.addName);
    }

    onAddImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
        this.addImageFile = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.addImagePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(this.addImageFile);
        input.value = '';
    }

    removeAddImage(): void {
        this.addImageFile = null;
        this.addImagePreview = null;
    }

    submitAdd(): void {
        if (!this.addName || !this.addSlug || this.isSubmitting) return;
        this.isSubmitting = true;
        const data: Partial<Category> = {
            name: this.addName,
            slug: this.addSlug,
            parent_id: this.addParentId || null,
            sort_order: this.addSortOrder,
            is_active: this.addIsActive
        };
        this.categoryService.create(data, this.addImageFile || undefined).subscribe({
            next: () => {
                this.showToast('Category created successfully');
                this.loadCategories();
                this.showAddForm = false;
                this.resetAddForm();
                this.isSubmitting = false;
            },
            error: (err) => {
                this.showToast(err.error?.message || 'Failed to create category');
                this.isSubmitting = false;
            }
        });
    }

    // ─── Edit ───────────────────────────────────────────────────────────────────
    openEdit(cat: Category): void {
        this.editCategory = cat;
        this.editName = cat.name;
        this.editSlug = cat.slug;
        this.editParentId = cat.parent_id || '';
        this.editSortOrder = cat.sort_order;
        this.editIsActive = cat.is_active;
        this.editImageFile = null;
        this.editImagePreview = null;
    }

    closeEdit(): void {
        this.editCategory = null;
        this.editImageFile = null;
        this.editImagePreview = null;
        this.isEditSubmitting = false;
    }

    onEditNameChange(): void {
        this.editSlug = this.generateSlug(this.editName);
    }

    onEditImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
        this.editImageFile = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.editImagePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(this.editImageFile);
        input.value = '';
    }

    removeEditImage(): void {
        this.editImageFile = null;
        this.editImagePreview = null;
    }

    submitEdit(): void {
        if (!this.editCategory || !this.editName || !this.editSlug || this.isEditSubmitting) return;
        this.isEditSubmitting = true;
        const id = this.catId(this.editCategory);
        const data: Partial<Category> = {
            name: this.editName,
            slug: this.editSlug,
            parent_id: this.editParentId || null,
            sort_order: this.editSortOrder,
            is_active: this.editIsActive
        };
        this.categoryService.update(id, data, this.editImageFile || undefined).subscribe({
            next: () => {
                this.showToast('Category updated successfully');
                this.loadCategories();
                this.closeEdit();
            },
            error: (err) => {
                this.showToast(err.error?.message || 'Failed to update category');
                this.isEditSubmitting = false;
            }
        });
    }

    // ─── Delete ─────────────────────────────────────────────────────────────────
    openDeleteConfirm(cat: Category): void {
        this.confirmDelete = cat;
    }

    closeDeleteConfirm(): void {
        this.confirmDelete = null;
    }

    confirmDeleteCategory(): void {
        if (!this.confirmDelete) return;
        const id = this.catId(this.confirmDelete);
        this.categoryService.remove(id).subscribe({
            next: () => {
                this.showToast('Category deleted');
                this.loadCategories();
                this.confirmDelete = null;
            },
            error: (err) => {
                this.showToast(err.error?.message || 'Failed to delete category');
                this.confirmDelete = null;
            }
        });
    }

    // ─── Parent name helper ────────────────────────────────────────────────────
    parentName(parentId: string | null | undefined): string {
        if (!parentId) return '—';
        const parent = this.categories.find(c => this.catId(c) === parentId);
        return parent ? parent.name : '—';
    }

    // ─── Assign Products ────────────────────────────────────────────────────────
    get filteredAssignProducts(): Product[] {
        if (!this.assignSearchTerm.trim()) return this.allProducts;
        const q = this.assignSearchTerm.toLowerCase();
        return this.allProducts.filter(p => p.name.toLowerCase().includes(q));
    }

    canAssign(p: Product): boolean {
        if (!this.assignCategory) return false;
        const currentCatId = this.catId(this.assignCategory);
        return !p.category_id || p.category_id === currentCatId;
    }

    openAssignModal(cat: Category): void {
        this.assignCategory = cat;
        this.assignedProductIds = new Set();
        this.assignSearchTerm = '';
        this.assignLoading = true;
        this.productService.list({ limit: 200 }).subscribe({
            next: (res) => {
                this.allProducts = res.products;
                const catId = this.catId(cat);
                res.products.forEach(p => {
                    if (p.category_id === catId) {
                        this.assignedProductIds.add(this.prodId(p));
                    }
                });
                this.assignLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.assignLoading = false; }
        });
    }

    closeAssignModal(): void {
        this.assignCategory = null;
        this.allProducts = [];
        this.assignedProductIds.clear();
        this.isAssignSubmitting = false;
    }

    toggleProductAssign(p: Product): void {
        const id = this.prodId(p);
        if (this.assignedProductIds.has(id)) {
            this.assignedProductIds.delete(id);
        } else {
            this.assignedProductIds.add(id);
        }
    }

    confirmAssign(): void {
        if (!this.assignCategory || this.isAssignSubmitting) return;
        this.isAssignSubmitting = true;
        const catId = this.catId(this.assignCategory);
        const toAssign = Array.from(this.assignedProductIds);
        const toUnassign = this.allProducts
            .filter(p => p.category_id === catId && !this.assignedProductIds.has(this.prodId(p)))
            .map(p => this.prodId(p));
        const ops: Promise<any>[] = [];
        if (toAssign.length) {
            ops.push(new Promise((res, rej) =>
                this.productService.bulkAssignCategory(toAssign, catId).subscribe({ next: res, error: rej })
            ));
        }
        if (toUnassign.length) {
            ops.push(new Promise((res, rej) =>
                this.productService.bulkAssignCategory(toUnassign, null).subscribe({ next: res, error: rej })
            ));
        }
        Promise.all(ops).then(() => {
            this.showToast('Products assigned successfully');
            this.closeAssignModal();
        }).catch(() => {
            this.showToast('Failed to save assignments');
            this.isAssignSubmitting = false;
        });
    }
}
