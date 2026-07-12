import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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

    productId(p: Product): string {
        return (p.id ?? p._id) as string;
    }

    canAssign(p: Product): boolean {
        if (!this.assignCategory) return false;
        const currentCatId = this.catId(this.assignCategory);
        // Can be changed ONLY if it has no category, or if it already belongs to THIS current category.
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
                // Pre-mark products already in this category
                const catId = this.catId(cat);
                res.products.forEach(p => {
                    if (p.category_id === catId) {
                        this.assignedProductIds.add(this.productId(p));
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
        const id = this.productId(p);
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

        // Products to assign to this category (checked)
        const toAssign = Array.from(this.assignedProductIds);
        // Products to unassign (were in this category but are now unchecked)
        const toUnassign = this.allProducts
            .filter(p => p.category_id === catId && !this.assignedProductIds.has(this.productId(p)))
            .map(p => this.productId(p));

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
