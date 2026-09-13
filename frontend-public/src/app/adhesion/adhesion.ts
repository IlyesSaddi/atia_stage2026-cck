import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast';
import { AdhesionService } from '../services/adhesion';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, catchError } from 'rxjs/operators';
import { of, forkJoin, EMPTY } from 'rxjs';
import { Router } from '@angular/router';


interface FormData {
  nom: string;
  prenom: string;
  email: string;
  tel: string;
  dob: string;
  statut: string;
  autreInteret: string;
  cin:string;
  consentStatut: boolean;
  consentReglement: boolean;
}

interface Interest {
  label: string;
  selected: boolean;
}
interface IAResponse {
  valide: boolean;
  motifsRejet: string[];
}
@Component({
  selector: 'app-adhesion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adhesion.html',
  styleUrls: ['./adhesion.css'],
})
export class Adhesion {
  constructor(private toastService: ToastService,private adhesionService: AdhesionService, private cdr: ChangeDetectorRef,  private router: Router,) {}
  currentStep = 1;
  submitted = false;
  isProcessing = false;
  processingMessage = '';
  iaRejet: { visible: boolean; motifs: string[] } = { visible: false, motifs: [] };
  checkingDuplicates = false;

  step1Errors: Record<string, string> = {
    nom: '', prenom: '', cin: '', email: '', tel: '', dob: '', statut: '',
  };

  clearFieldError(field: string): void {
    this.step1Errors[field] = '';
  }

  validateField(field: string): void {
    const nameRegex  = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{8,12}$/;
    const cinRegex   = /^[0-9]{8}$/;
    switch (field) {
      case 'nom':
        if (!this.formData.nom.trim())                   this.step1Errors['nom'] = 'Ce champ est obligatoire.';
        else if (!nameRegex.test(this.formData.nom))     this.step1Errors['nom'] = 'Lettres et espaces uniquement.';
        else                                             this.step1Errors['nom'] = '';
        break;
      case 'prenom':
        if (!this.formData.prenom.trim())                this.step1Errors['prenom'] = 'Ce champ est obligatoire.';
        else if (!nameRegex.test(this.formData.prenom))  this.step1Errors['prenom'] = 'Lettres et espaces uniquement.';
        else                                             this.step1Errors['prenom'] = '';
        break;
      case 'cin':
        if (!this.formData.cin.trim())                   this.step1Errors['cin'] = 'Ce champ est obligatoire.';
        else if (!cinRegex.test(this.formData.cin))      this.step1Errors['cin'] = 'Exactement 8 chiffres requis.';
        else                                             this.step1Errors['cin'] = '';
        break;
      case 'email':
        if (!this.formData.email.trim())                 this.step1Errors['email'] = 'Ce champ est obligatoire.';
        else if (!emailRegex.test(this.formData.email))  this.step1Errors['email'] = 'Adresse email invalide.';
        else                                             this.step1Errors['email'] = '';
        break;
      case 'tel':
        if (!this.formData.tel.trim())                   this.step1Errors['tel'] = 'Ce champ est obligatoire.';
        else if (!phoneRegex.test(this.formData.tel))    this.step1Errors['tel'] = 'Numéro invalide (8 à 12 chiffres).';
        else                                             this.step1Errors['tel'] = '';
        break;
      case 'dob':
        if (!this.formData.dob)                          this.step1Errors['dob'] = 'Ce champ est obligatoire.';
        else                                             this.step1Errors['dob'] = '';
        break;
    }
  }
  formData: FormData = {
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    dob: '',
    statut: '',
    autreInteret: '',
    cin:'',
    consentStatut: false,
    consentReglement: false,
  };

  // MODIF — industriel → enseignant
  statutOptions = [
    { value: 'etudiant',      label: 'Étudiant'      },
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'chercheur',     label: 'Chercheur'     },
    { value: 'enseignant',    label: 'Enseignant'    },
  ];

  interests: Interest[] = [
    { label: '🤖 Intelligence Artificielle', selected: false },
    { label: '🧠 Machine Learning',          selected: false },
    { label: '🔬 Deep Learning',             selected: false },
    { label: '📊 Data Science',              selected: false },
    { label: '💾 Big Data',                  selected: false },
    { label: '💬 NLP',                       selected: false },
    { label: '👁️ Computer Vision',           selected: false },
    { label: '🦾 Robotique',                 selected: false },
    { label: '🔐 Cybersécurité & IA',        selected: false },
    { label: '🏥 IA & Santé',                selected: false },
    { label: '🌱 IA & Agriculture',          selected: false },
    { label: '🎓 IA & Éducation',            selected: false },
    { label: '✨ IA Générative',             selected: false },
    { label: '📡 IoT & Embarqué',            selected: false },
    { label: '⚖️ Éthique de l\'IA',          selected: false },
  ];

  cinFileName   = '';
  justifFileName = '';
  cinHasFile    = false;
  justifHasFile = false;
  cinDragOver   = false;
  justifDragOver = false;

  cinFile: File | null = null;
  justifFile: File | null = null;

  recuFile:     File | null = null;
  recuFileName  = '';
  recuHasFile   = false;
  recuDragOver  = false;

  cinPreview:    string | null = null;
  justifPreview: string | null = null;
  recuPreview:   string | null = null;

  get progressPercent(): number {
    return ((this.currentStep - 1) / 4) * 100;
  }

goTo(step: number): void {
  if (step < this.currentStep) {
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (this.currentStep === 1) {
    if (!this.validateStep1Sync()) return;
    this.checkingDuplicates = true;
    this.adhesionService.getAllMembres().subscribe({
      next: (membres) => {
        this.checkingDuplicates = false;
        console.log('[Adhesion] membres reçus:', membres.length, membres[0]);
        if (!this.checkDuplicates(membres)) return;
        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.checkingDuplicates = false;
        const status = err?.status ?? 0;
        if (status === 401 || status === 403) {
          // Endpoint protégé — pas de token pour le formulaire public → on passe sans vérification doublon
          console.warn('[Adhesion] /membres/all inaccessible (auth requise). Ajoutez-le aux URLs publiques Spring Security.');
          this.currentStep = step;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.toastService.error(
            'Connexion impossible',
            'Nos serveurs sont momentanément injoignables. Merci de réessayer dans quelques instants.'
          );
        }
        this.cdr.detectChanges();
      }
    });
    return;
  }

  if (this.currentStep === 2 && !this.validateStep2()) return;
  if (this.currentStep === 3 && !this.validateStep3()) return;

  this.currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  selectStatut(value: string): void {
    this.formData.statut = value;
    this.clearFieldError('statut');
  }

  toggleInterest(interest: Interest): void {
    interest.selected = !interest.selected;
  }

 
  onCinChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.setCinFile(file); }
  }
  onCinDragOver(event: DragEvent): void { event.preventDefault(); this.cinDragOver = true; }
  onCinDragLeave(): void { this.cinDragOver = false; }
  onCinDrop(event: DragEvent): void {
    event.preventDefault(); this.cinDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.setCinFile(file); }
  }
  private setCinFile(file: File): void {
    this.cinFile     = file;
    this.cinFileName = file.name;
    this.cinHasFile  = true;
    this.cinPreview  = null;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => { this.cinPreview = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(file);
    }
  }

  onJustifChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.setJustifFile(file); }
  }
  onJustifDragOver(event: DragEvent): void { event.preventDefault(); this.justifDragOver = true; }
  onJustifDragLeave(): void { this.justifDragOver = false; }
  onJustifDrop(event: DragEvent): void {
    event.preventDefault(); this.justifDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.setJustifFile(file); }
  }
  private setJustifFile(file: File): void {
    this.justifFile     = file;
    this.justifFileName = file.name;
    this.justifHasFile  = true;
    this.justifPreview  = null;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => { this.justifPreview = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(file);
    }
  }

  onRecuChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.setRecuFile(file); }
  }
  onRecuDragOver(event: DragEvent): void { event.preventDefault(); this.recuDragOver = true; }
  onRecuDragLeave(): void { this.recuDragOver = false; }
  onRecuDrop(event: DragEvent): void {
    event.preventDefault(); this.recuDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.setRecuFile(file); }
  }
  private setRecuFile(file: File): void {
    this.recuFile     = file;
    this.recuFileName = file.name;
    this.recuHasFile  = true;
    this.recuPreview  = null;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => { this.recuPreview = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(file);
    }
  }

 
  ouvrirStatut(): void {
    window.open('assets/documents/Statut.pdf', '_blank');
  }

  
  montantAPayer(): number {
    const montants: { [key: string]: number } = {
      etudiant:      20,
      chercheur:     30,
      enseignant:    30,
      professionnel: 50,
    };
    return montants[this.formData.statut] || 0;
  }
private validateStep1Sync(): boolean {
  const { nom, prenom, email, tel, dob, statut, cin } = this.formData;
  const nameRegex  = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{8,12}$/;
  const cinRegex   = /^[0-9]{8}$/;

  Object.keys(this.step1Errors).forEach(k => (this.step1Errors[k] = ''));
  let valid = true;

  if (!nom.trim()) {
    this.step1Errors['nom'] = 'Ce champ est obligatoire.'; valid = false;
  } else if (!nameRegex.test(nom)) {
    this.step1Errors['nom'] = 'Lettres et espaces uniquement.'; valid = false;
  }

  if (!prenom.trim()) {
    this.step1Errors['prenom'] = 'Ce champ est obligatoire.'; valid = false;
  } else if (!nameRegex.test(prenom)) {
    this.step1Errors['prenom'] = 'Lettres et espaces uniquement.'; valid = false;
  }

  if (!cin.trim()) {
    this.step1Errors['cin'] = 'Ce champ est obligatoire.'; valid = false;
  } else if (!cinRegex.test(cin)) {
    this.step1Errors['cin'] = 'Exactement 8 chiffres requis.'; valid = false;
  }

  if (!email.trim()) {
    this.step1Errors['email'] = 'Ce champ est obligatoire.'; valid = false;
  } else if (!emailRegex.test(email)) {
    this.step1Errors['email'] = 'Adresse email invalide.'; valid = false;
  }

  if (!tel.trim()) {
    this.step1Errors['tel'] = 'Ce champ est obligatoire.'; valid = false;
  } else if (!phoneRegex.test(tel)) {
    this.step1Errors['tel'] = 'Numéro invalide (8 à 12 chiffres).'; valid = false;
  }

  if (!dob) {
    this.step1Errors['dob'] = 'Ce champ est obligatoire.'; valid = false;
  }

  if (!statut) {
    this.step1Errors['statut'] = 'Veuillez sélectionner un statut.'; valid = false;
  }

  return valid;
}

private checkDuplicates(membres: any[]): boolean {
  const { email, tel, cin } = this.formData;
  let valid = true;

  if (membres.some(m => m.email?.toLowerCase() === email.toLowerCase())) {
    this.step1Errors['email'] = 'Cette adresse email est déjà utilisée.'; valid = false;
  }
  if (membres.some(m => m.telephone === tel)) {
    this.step1Errors['tel'] = 'Ce numéro de téléphone est déjà utilisé.'; valid = false;
  }
  if (membres.some(m => m.cinNumero === cin)) {
    this.step1Errors['cin'] = 'Ce CIN est déjà enregistré.'; valid = false;
  }

  if (!valid) this.cdr.detectChanges();
  return valid;
}

private validateStep2(): boolean {
  if (!this.cinHasFile) {
    this.toastService.info(
      'Pièce d\'identité manquante',
      'Ajoutez une copie de votre CIN pour poursuivre votre inscription.'
    );
    return false;
  }
  if (!this.justifHasFile) {
    this.toastService.warning(
      'Justificatif requis',
      'Un justificatif de votre statut (carte étudiante, attestation…) est nécessaire pour continuer.'
    );
    return false;
  }
  return true;
}

private validateStep3(): boolean {
  
  const hasInterest = this.interests.some(interest => interest.selected);
  
 
  const hasOther = this.formData.autreInteret && this.formData.autreInteret.trim().length > 2;

  if (!hasInterest && !hasOther) {
    this.toastService.warning(
      'Centre d\'intérêt requis',
      'Sélectionnez au moins un domaine qui vous passionne .'
    );
    return false;
  }
  return true;
}
private validateStep5(): boolean {
 
  if (!this.recuHasFile) {
    this.toastService.warning(
      'Reçu de paiement manquant',
      'Joignez votre reçu de paiement pour finaliser votre demande d\'adhésion.'
    );
    return false;
  }
  return true;
}
submitForm(): void {
  if (!this.validateStep5()) return;

  if (!this.cinFile || !this.justifFile || !this.recuFile) {
    this.toastService.warning(
      'Documents incomplets',
      'Merci de fournir votre CIN, votre justificatif et votre reçu de paiement avant de soumettre.'
    );
    return;
  }

  this.iaRejet = { visible: false, motifs: [] };
  this.isProcessing = true;
  this.processingMessage = 'Analyse de vos documents…';
  this.cdr.detectChanges();

  const formDataIA = new FormData();
  formDataIA.append('cin', this.cinFile);
  formDataIA.append('justificatif', this.justifFile);
  formDataIA.append('recu', this.recuFile);
  formDataIA.append('nom', this.formData.nom);
  formDataIA.append('prenom', this.formData.prenom);
  formDataIA.append('statut', this.formData.statut);
  formDataIA.append('cin_numero', this.formData.cin);
  formDataIA.append('date_naissance', this.formData.dob);

  this.adhesionService.validerAvecIA(formDataIA).pipe(
   catchError((err: HttpErrorResponse) => {
  this.isProcessing = false;
  this.processingMessage = '';

  let message = "Le service de validation IA est actuellement indisponible.";

  if (err.status === 0) {
    message = "Impossible de contacter le service IA. Vérifiez qu'il est bien démarré.";
  } else if (err.status === 503) {
    message = "Le service IA est momentanément indisponible. Veuillez réessayer dans quelques instants.";
  }

  this.toastService.error(
    "Validation impossible",
    message
  );

  this.cdr.detectChanges();

  return EMPTY;
}),
    switchMap((responseIA: IAResponse) => {
      if (!responseIA.valide) {
        this.isProcessing = false;
        this.processingMessage = '';
        this.iaRejet = { visible: true, motifs: responseIA.motifsRejet ?? [] };
        this.cdr.detectChanges();
        return EMPTY;
      }
      this.processingMessage = 'Envoi des documents…';
      this.cdr.detectChanges();
      return forkJoin({
        cinImg:    this.adhesionService.uploadImage(this.cinFile!,    this.cinFile!.name),
        justifImg: this.adhesionService.uploadImage(this.justifFile!, this.justifFile!.name),
        recuImg:   this.adhesionService.uploadImage(this.recuFile!,   this.recuFile!.name),
      });
    }),
    switchMap(({ cinImg, justifImg, recuImg }) => {
      this.processingMessage = 'Finalisation de votre dossier…';
      this.cdr.detectChanges();
      const interets = this.interests.filter(i => i.selected).map(i => i.label);
      if (this.formData.autreInteret?.trim()) {
        interets.push(this.formData.autreInteret.trim());
      }
      return this.adhesionService.sauvegarderMembre({
        nom:               this.formData.nom,
        prenom:            this.formData.prenom,
        email:             this.formData.email,
        telephone:         this.formData.tel,
        dateNaissance:     this.formData.dob,
        statut:            this.formData.statut.toUpperCase(),
        cinNumero:         this.formData.cin,
        consentement:      true,
        centresInteret:    interets,
        cinImageId:          cinImg?.idImage,
        justificatifImageId: justifImg?.idImage,
        recuPaiementImageId: recuImg?.idImage,
      });
    })
  ).subscribe({
    next: () => {
      this.isProcessing = false;
      this.processingMessage = '';
      this.submitted = true;
      this.toastService.success(
        'Adhésion envoyée',
        'Votre demande d\'adhésion à l\'ATIA a bien été enregistrée.'
      );
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.isProcessing = false;
      this.processingMessage = '';
      const msg = err instanceof Error
        ? err.message
        : 'Une erreur est survenue lors de l\'envoi de votre dossier. Vérifiez votre connexion et réessayez.';
      console.error("Erreur soumission :", err);
      this.toastService.error("Échec de l'inscription", msg);
      this.cdr.detectChanges();
    }
  });
}
retourAccueil() {
  this.router.navigate(['/']); 
}
}