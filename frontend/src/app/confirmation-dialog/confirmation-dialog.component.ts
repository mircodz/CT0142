import {Component, Input, OnInit} from "@angular/core";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-confirmation-dialog",
    templateUrl: "./confirmation-dialog.component.html",
    styleUrls: ["./confirmation-dialog.component.css"]
})
export class ConfirmationDialogComponent implements OnInit {
    @Input() title ="";
    @Input() message="";
    @Input() btnOkText="";
    @Input() btnCancelText="";

    constructor(private activeModal: NgbActiveModal) { }

    ngOnInit() {
    }

    public decline() {
        this.activeModal.close(false);
    }

    public accept() {
        this.activeModal.close(true);
    }

    public dismiss() {
        this.activeModal.dismiss();
    }
}
