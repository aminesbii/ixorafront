import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProductService } from '../../../../core/services/product.service';
import { Product, ProductImage, ProductVariant } from '../../../../core/models/product.model';
import { firstValueFrom, of, switchMap } from 'rxjs';

export interface VariantCreationItem {
  variant_name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  imageFile?: File | null;
  imagePreview?: SafeUrl | null;
}

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css'],
  standalone: false
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  showAddForm = false;
  productForm: FormGroup;

  // Filters
  searchTerm = '';
  filterStatus = '';
  sortDate = '';
  filterFeatured = false;

  // Image upload (create mode)
  featured1File: File | null = null;
  featured1Preview: SafeUrl | null = null;
  featured2File: File | null = null;
  featured2Preview: SafeUrl | null = null;
  selectedImages: File[] = [];
  imagePreviews: SafeUrl[] = [];
  isSubmitting = false;
  newVariants: VariantCreationItem[] = [];

  // Edit modal
  editProduct: Product | null = null;
  editForm: FormGroup;
  editFeatured1File: File | null = null;
  editFeatured1Preview: SafeUrl | null = null;
  editFeatured2File: File | null = null;
  editFeatured2Preview: SafeUrl | null = null;
  editSelectedImages: File[] = [];
  editImagePreviews: SafeUrl[] = [];
  isEditSubmitting = false;

  // Stock adjust
  adjustVariant: { productId: string; variant: ProductVariant } | null = null;
  stockAdjustments: { [key: string]: number } = {};

  // Toast
  toastMessage = '';
  toastVisible = false;
  private toastTimer: any = null;

  // Delete confirm
  confirmDelete: Product | null = null;

  // Multi-select
  selectedIds: Set<string> = new Set();

  get allSelected(): boolean {
    return this.products.length > 0 && this.products.every(p => this.selectedIds.has(this.productId(p)));
  }

  toggleSelect(product: Product): void {
    const id = this.productId(product);
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.products.forEach(p => this.selectedIds.add(this.productId(p)));
    }
  }

  bulkSoftDelete(): void {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    this.productService.softDeleteMultiple(ids).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.loadProducts();
      }
    });
  }

  // Inline expand variants
  expandedProductId: string | null = null;
  expandedVariants: { [key: string]: ProductVariant[] } = {};
  expandedLoading: { [key: string]: boolean } = {};
  expandedNewVariants: { [key: string]: VariantCreationItem[] } = {};

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      short_description: [''],
      description: [''],
      status: ['draft', Validators.required],
      is_featured: [false],
      base_price: [null],
      currency: ['TND'],
      on_sale: [false],
      sale_percentage: [{ value: null, disabled: true }],
      sale_end_date: [{ value: null, disabled: true }],
      details: this.fb.group({
        indication: [''],
        usage: [''],
        composition: ['']
      })
    });

    this.editForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      short_description: [''],
      description: [''],
      status: ['draft', Validators.required],
      is_featured: [false],
      base_price: [null],
      currency: ['TND'],
      on_sale: [false],
      sale_percentage: [{ value: null, disabled: true }],
      sale_end_date: [{ value: null, disabled: true }],
      details: this.fb.group({
        indication: [''],
        usage: [''],
        composition: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  loadProducts(): void {
    this.loading = true;
    this.brokenImages.clear();
    const params: any = { limit: 100 };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterFeatured) params.is_featured = true;
    if (this.sortDate === 'newest') params.sort = '-createdAt';
    else if (this.sortDate === 'oldest') params.sort = 'createdAt';
    this.productService.list(params).subscribe({
      next: (res: { products: Product[]; pagination: any }) => {
        this.products = res.products;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  applyFilters(): void {
    this.loadProducts();
  }

  productId(p: Product): string {
    return (p.id ?? p._id) as string;
  }

  variantId(v: ProductVariant): string {
    return (v.id ?? v._id) as string;
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  generateSlug(name: string): void {
    this.productForm.patchValue({
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.productForm.reset({ status: 'draft', is_featured: false, base_price: null, currency: 'TND', on_sale: false, sale_percentage: null, sale_end_date: null, details: { indication: '', usage: '', composition: '' } });
      this.productForm.get('sale_percentage')?.disable();
      this.productForm.get('sale_end_date')?.disable();
      this.resetCreateImages();
      this.newVariants = [];
    }
  }

  private resetCreateImages(): void {
    this.featured1File = null;
    this.featured1Preview = null;
    this.featured2File = null;
    this.featured2Preview = null;
    this.selectedImages = [];
    this.imagePreviews = [];
  }

  private makePreview(file: File): SafeUrl {
    const reader = new FileReader();
    let preview: SafeUrl | null = null;
    reader.onload = () => {
      preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    return preview!;
  }

  // ─── Inline Variants for Create ─────────────────────────────────────────────
  addNewVariant(): void {
    const slug = this.productForm.get('slug')?.value || 'product';
    this.newVariants.push({
      variant_name: '',
      sku: `${slug.toUpperCase()}-V${this.newVariants.length + 1}`,
      price: this.productForm.get('base_price')?.value || 0,
      compare_at_price: null,
      stock_qty: 0,
    });
  }

  removeNewVariant(index: number): void {
    this.newVariants.splice(index, 1);
  }

  onVariantImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.newVariants[index].imageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.newVariants[index].imagePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeVariantImage(index: number): void {
    this.newVariants[index].imageFile = null;
    this.newVariants[index].imagePreview = null;
  }

  // ─── Featured 1 Upload ─────────────────────────────────────────────────────
  onFeatured1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.featured1File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.featured1Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.featured1File);
    input.value = '';
  }

  removeFeatured1(): void {
    this.featured1File = null;
    this.featured1Preview = null;
  }

  // ─── Featured 2 Upload ─────────────────────────────────────────────────────
  onFeatured2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.featured2File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.featured2Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.featured2File);
    input.value = '';
  }

  removeFeatured2(): void {
    this.featured2File = null;
    this.featured2Preview = null;
  }

  // ─── Other Images Upload ───────────────────────────────────────────────────
  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
      if (this.selectedImages.length >= 3) break;
      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(
          this.sanitizer.bypassSecurityTrustUrl(reader.result as string)
        );
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
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

  private async uploadAllImages(productId: string): Promise<void> {
    if (this.featured1File) {
      try {
        await firstValueFrom(this.productService.uploadFeatured1(productId, this.featured1File));
      } catch (err: any) {
        this.showToast(err.error?.message || err.message || 'Failed to upload featured image 1');
      }
    }
    if (this.featured2File) {
      try {
        await firstValueFrom(this.productService.uploadFeatured2(productId, this.featured2File));
      } catch (err: any) {
        this.showToast(err.error?.message || err.message || 'Failed to upload featured image 2');
      }
    }
    for (let i = 0; i < this.selectedImages.length; i++) {
      try {
        await firstValueFrom(this.productService.addImage(productId, this.selectedImages[i], undefined, 10 + i));
      } catch (err: any) {
        this.showToast(err.error?.message || err.message || `Failed to upload image ${i + 1}`);
      }
    }
  }

  private prepareFormValue(form: FormGroup): any {
    const raw = form.getRawValue();
    if (raw.details) {
      raw.details = {
        ...raw.details,
        composition: raw.details.composition
          ? raw.details.composition.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []
      };
    }
    if (!raw.on_sale) {
      raw.sale_percentage = null;
      raw.sale_end_date = null;
    }
    if (raw.sale_end_date) {
      raw.sale_end_date = new Date(raw.sale_end_date).toISOString();
    }
    return raw;
  }

  onSubmit(): void {
    if (this.productForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.productService.create(this.prepareFormValue(this.productForm)).pipe(
      switchMap((product: Product) => {
        const id = product.id ?? (product as any)._id;

        const uploadTask = async () => {
          if (id && (this.featured1File || this.featured2File || this.selectedImages.length)) {
            await this.uploadAllImages(id);
          }
          if (id && this.newVariants.length) {
            for (const v of this.newVariants) {
              try {
                const created = await firstValueFrom(this.productService.addVariant(id, {
                  sku: v.sku || `${product.slug.toUpperCase()}-V`,
                  variant_name: v.variant_name,
                  price: v.price,
                  compare_at_price: v.compare_at_price,
                  currency: product.currency || 'TND',
                  stock_qty: v.stock_qty,
                  is_active: true
                }));
                const variantId = created.id ?? (created as any)._id;
                if (v.imageFile && variantId) {
                  await firstValueFrom(this.productService.uploadVariantImage(id, variantId, v.imageFile));
                }
              } catch (err: any) {
                this.showToast(err.error?.message || err.message || 'Failed to create variant');
              }
            }
          }
          return product;
        };

        return uploadTask();
      })
    ).subscribe({
      next: () => {
        this.loadProducts();
        this.showAddForm = false;
        this.productForm.reset({ status: 'draft', is_featured: false, details: { indication: '', usage: '', composition: '' } });
        this.resetCreateImages();
        this.newVariants = [];
        this.isSubmitting = false;
      },
      error: () => { this.isSubmitting = false; }
    });
  }

  // ─── Edit ────────────────────────────────────────────────────────────────────

  openEditModal(product: Product): void {
    this.editProduct = product;
    this.editSelectedImages = [];
    this.editImagePreviews = [];
    this.editForm.patchValue({
      name: product.name,
      slug: product.slug,
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      status: product.status,
      is_featured: product.is_featured,
      base_price: product.base_price ?? null,
      currency: product.currency ?? 'TND',
      on_sale: product.on_sale ?? false,
      sale_percentage: product.sale_percentage ?? null,
      sale_end_date: product.sale_end_date ? new Date(product.sale_end_date) : null,
      details: {
        indication: product.details?.indication ?? '',
        usage: product.details?.usage ?? '',
        composition: product.details?.composition?.join(', ') ?? ''
      }
    });
    this.toggleSalePercentage(product.on_sale ?? false);
  }

  private toggleSalePercentage(enabled: boolean): void {
    if (enabled) {
      this.editForm.get('sale_percentage')?.enable();
      this.editForm.get('sale_end_date')?.enable();
    } else {
      this.editForm.get('sale_percentage')?.disable();
      this.editForm.get('sale_percentage')?.setValue(null);
      this.editForm.get('sale_end_date')?.disable();
      this.editForm.get('sale_end_date')?.setValue(null);
    }
  }

  onSaleChanged(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleSalePercentage(checked);
  }

  onCreateSaleChanged(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.productForm.get('sale_percentage')?.enable();
      this.productForm.get('sale_end_date')?.enable();
    } else {
      this.productForm.get('sale_percentage')?.disable();
      this.productForm.get('sale_percentage')?.setValue(null);
      this.productForm.get('sale_end_date')?.disable();
      this.productForm.get('sale_end_date')?.setValue(null);
    }
  }

  closeEditModal(): void {
    this.editProduct = null;
    this.editFeatured1File = null;
    this.editFeatured1Preview = null;
    this.editFeatured2File = null;
    this.editFeatured2Preview = null;
    this.editSelectedImages = [];
    this.editImagePreviews = [];
    this.isEditSubmitting = false;
  }

  generateEditSlug(name: string): void {
    this.editForm.patchValue({
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  }

  // ─── Edit Featured 1 ───────────────────────────────────────────────────────
  onEditFeatured1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.editFeatured1File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.editFeatured1Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.editFeatured1File);
    input.value = '';
  }

  removeEditFeatured1(): void {
    this.editFeatured1File = null;
    this.editFeatured1Preview = null;
  }

  // ─── Edit Featured 2 ───────────────────────────────────────────────────────
  onEditFeatured2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.editFeatured2File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.editFeatured2Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.editFeatured2File);
    input.value = '';
  }

  removeEditFeatured2(): void {
    this.editFeatured2File = null;
    this.editFeatured2Preview = null;
  }

  // ─── Edit Other Images ─────────────────────────────────────────────────────
  onEditImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
      if (this.editSelectedImages.length >= 3) break;
      this.editSelectedImages.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreviews.push(
          this.sanitizer.bypassSecurityTrustUrl(reader.result as string)
        );
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeEditNewImage(index: number): void {
    this.editSelectedImages.splice(index, 1);
    this.editImagePreviews.splice(index, 1);
  }

  deleteExistingImage(productId: string, image: ProductImage): void {
    const imageId = image.id ?? image._id!;
    this.productService.deleteImage(productId, imageId).subscribe({
      next: () => {
        if (this.editProduct?.images) {
          this.editProduct.images = this.editProduct.images.filter(
            (img) => (img.id ?? img._id) !== imageId
          );
        }
      },
      error: (err: any) => {
        this.showToast(err.error?.message || err.message || 'Failed to delete image');
      }
    });
  }

  onEditSubmit(): void {
    if (!this.editProduct || this.editForm.invalid || this.isEditSubmitting) return;
    this.isEditSubmitting = true;
    const id = this.productId(this.editProduct);

    this.productService.update(id, this.prepareFormValue(this.editForm)).pipe(
      switchMap(async () => {
        if (this.editFeatured1File) {
          try {
            await firstValueFrom(this.productService.uploadFeatured1(id, this.editFeatured1File));
          } catch (err: any) {
            this.showToast(err.error?.message || err.message || 'Failed to upload featured image 1');
          }
        }
        if (this.editFeatured2File) {
          try {
            await firstValueFrom(this.productService.uploadFeatured2(id, this.editFeatured2File));
          } catch (err: any) {
            this.showToast(err.error?.message || err.message || 'Failed to upload featured image 2');
          }
        }
        for (let i = 0; i < this.editSelectedImages.length; i++) {
          try {
            await firstValueFrom(this.productService.addImage(id, this.editSelectedImages[i], undefined, 10 + i));
          } catch (err: any) {
            this.showToast(err.error?.message || err.message || `Failed to upload image ${i + 1}`);
          }
        }
      })
    ).subscribe({
      next: () => {
        this.loadProducts();
        this.closeEditModal();
      },
      error: () => { this.isEditSubmitting = false; }
    });
  }

  // ─── Variants in Edit Modal ────────────────────────────────────────────────

  saveEditVariant(variant: ProductVariant): void {
    if (!this.editProduct || !variant.id) return;
    this.productService.updateVariant(this.productId(this.editProduct), variant.id, {
      variant_name: variant.variant_name,
      sku: variant.sku,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      stock_qty: variant.stock_qty,
      is_active: variant.is_active
    }).subscribe({
      next: () => {
        this.loadProducts();
      }
    });
  }

  deleteEditVariant(variant: ProductVariant): void {
    if (!this.editProduct || !variant.id) return;
    if (confirm(`Are you sure you want to delete the variant ${variant.variant_name || variant.sku}?`)) {
      this.productService.deleteVariant(this.productId(this.editProduct), variant.id).subscribe({
        next: () => {
          if (this.editProduct) {
            this.editProduct.variants = this.editProduct.variants?.filter(v => v.id !== variant.id);
          }
          this.loadProducts();
        }
      });
    }
  }

  addEditVariant(): void {
    if (!this.editProduct) return;
    const count = this.editProduct.variants?.length || 0;
    this.productService.addVariant(this.productId(this.editProduct), {
      sku: `${this.editProduct.slug.toUpperCase()}-V${count + 1}`,
      variant_name: '',
      price: this.editProduct.base_price || 0,
      stock_qty: 0,
      currency: this.editProduct.currency || 'TND',
      is_active: true
    }).subscribe({
      next: (created) => {
        if (!this.editProduct) return;
        if (!this.editProduct.variants) this.editProduct.variants = [];
        this.editProduct.variants.push(created);
        this.loadProducts();
      }
    });
  }

  onEditVariantImageSelected(variant: ProductVariant, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.editProduct || (!variant.id && !variant._id)) return;
    const file = input.files[0];
    const variantId = variant.id ?? variant._id!;
    this.productService.uploadVariantImage(this.productId(this.editProduct), variantId, file).subscribe({
      next: (updated) => {
        variant.image_url = updated.image_url;
        this.loadProducts();
      },
      error: (err: any) => {
        this.showToast(err.error?.message || err.message || 'Failed to upload variant image');
      }
    });
    input.value = '';
  }

  // ─── Stock ───────────────────────────────────────────────────────────────────

  openAdjustStock(productId: string, variant: ProductVariant): void {
    this.adjustVariant = { productId, variant };
    this.stockAdjustments[`${productId}-${this.variantId(variant)}`] = 0;
  }

  closeAdjustStock(): void { this.adjustVariant = null; }

  submitAdjustStock(productId: string, variantId: string): void {
    const delta = this.stockAdjustments[`${productId}-${variantId}`];
    if (delta === undefined || delta === 0) return;
    this.productService.adjustStock(productId, variantId, delta).subscribe({
      next: () => { this.loadProducts(); this.closeAdjustStock(); }
    });
  }

  // ─── Inline Expand Variants ─────────────────────────────────────────────────

  toggleExpand(product: Product): void {
    const id = this.productId(product);
    if (this.expandedProductId === id) {
      this.expandedProductId = null;
      return;
    }
    this.expandedProductId = id;
    if (!this.expandedVariants[id]) {
      this.loadVariantsForProduct(id);
    }
  }

  loadVariantsForProduct(productId: string): void {
    this.expandedLoading[productId] = true;
    this.productService.listVariants(productId).subscribe({
      next: (variants) => {
        this.expandedVariants[productId] = variants;
        this.expandedLoading[productId] = false;
      },
      error: () => {
        this.expandedVariants[productId] = [];
        this.expandedLoading[productId] = false;
      }
    });
  }

  addNewExpandedVariant(product: Product): void {
    const id = this.productId(product);
    if (!this.expandedNewVariants[id]) this.expandedNewVariants[id] = [];
    const slug = product.slug;
    const existingCount = (this.expandedVariants[id]?.length || 0) + this.expandedNewVariants[id].length;
    this.expandedNewVariants[id].push({
      variant_name: '',
      sku: `${slug.toUpperCase()}-V${existingCount + 1}`,
      price: product.base_price || 0,
      compare_at_price: null,
      stock_qty: 0,
    });
  }

  saveNewExpandedVariant(product: Product, index: number): void {
    const id = this.productId(product);
    const pending = this.expandedNewVariants[id]?.[index];
    if (!pending) return;
    this.productService.addVariant(id, {
      sku: pending.sku,
      variant_name: pending.variant_name,
      price: pending.price,
      compare_at_price: pending.compare_at_price,
      stock_qty: pending.stock_qty,
      currency: product.currency || 'TND',
      is_active: true
    }).subscribe({
      next: (created) => {
        if (!this.expandedVariants[id]) this.expandedVariants[id] = [];
        this.expandedVariants[id].push(created);
        this.expandedNewVariants[id].splice(index, 1);
      }
    });
  }

  cancelNewExpandedVariant(productId: string, index: number): void {
    this.expandedNewVariants[productId]?.splice(index, 1);
  }

  saveVariantExpanded(productId: string, variant: ProductVariant): void {
    const variantId = this.variantId(variant);
    if (!variantId) return;
    this.productService.updateVariant(productId, variantId, {
      variant_name: variant.variant_name,
      sku: variant.sku,
      price: variant.price,
      stock_qty: variant.stock_qty,
      is_active: variant.is_active
    }).subscribe({});
  }

  deleteVariantExpanded(productId: string, variant: ProductVariant): void {
    const variantId = this.variantId(variant);
    if (confirm(`Are you sure you want to delete the variant ${variant.variant_name || variant.sku}?`)) {
      this.productService.deleteVariant(productId, variantId).subscribe({
        next: () => {
          this.expandedVariants[productId] = this.expandedVariants[productId]?.filter(v => this.variantId(v) !== variantId) || [];
        }
      });
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  confirmDeleteProduct(product: Product): void { this.confirmDelete = product; }
  cancelDelete(): void { this.confirmDelete = null; }

  executeDelete(id: string): void {
    this.productService.remove(id).subscribe({
      next: () => { this.loadProducts(); this.confirmDelete = null; }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  brokenImages: Set<string> = new Set();

  get editHasFeatured1(): boolean {
    return !!this.editProduct?.images?.some(i => i.featured1);
  }

  get editHasFeatured2(): boolean {
    return !!this.editProduct?.images?.some(i => i.featured2);
  }

  onImageLoad(product: Product): void {
    console.debug('[Image] Loaded OK:', product.name);
  }

  onImageError(product: Product): void {
    const id = this.productId(product);
    this.brokenImages.add(id);
    const url = this.getMainImage(product);
    console.warn('[Image] Failed to load:', url, 'for product:', product.name, 'id:', id);
  }

  showMainImage(product: Product): boolean {
    const url = this.getMainImage(product);
    return !!url && !this.brokenImages.has(this.productId(product));
  }

  getImageUrl(img: ProductImage): string {
    const url = img.image_url;
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) return '/api' + parsed.pathname;
      if (parsed.pathname.startsWith('/api/uploads/')) return parsed.pathname;
      return parsed.pathname;
    }
    if (url.startsWith('/api/uploads/')) return url;
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return '/api/uploads/' + url;
  }

  getMainImage(product: Product): string | null {
    if (!product.images?.length) return null;
    const img = product.images.find(i => i.featured1) || product.images.find(i => i.is_main) || product.images[0];
    return this.getImageUrl(img);
  }

  totalStock(variants: ProductVariant[]): number {
    return variants.reduce((sum, v) => sum + v.stock_qty, 0);
  }

  getProductPrice(product: Product): string {
    if (product.base_price != null) return `${product.base_price} ${product.currency || 'TND'}`;
    const v = product.variants;
    if (v?.length) {
      const prices = v.map(x => x.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return `${min} ${product.currency || 'TND'}`;
      return `${min} - ${max} ${product.currency || 'TND'}`;
    }
    return '-';
  }
}
