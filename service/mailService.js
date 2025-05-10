const { EmailTemplate } = require("../models");
const {
    STATIC_CONTENT_BASE_ENDPOINT,
    SPIN_THE_WHEEL_BASE_URL,
    STATIC_FRONTEND_BASE_URL,
} = require("../config");
const mtz = require("moment-timezone");
const UtilsService = require("../services/UtilsService");

class EmailService {
    static getDateString(date) {
        return `${mtz(date)
            .tz("Africa/Johannesburg")
            .format("ddd, MMM DD YYYY")} SAST`;
    }

    static async testDummy() {
        console.log("Testing out the email working!");
        let { transporter, emailUser } = UtilsService.getStoreConfig(
            "8932d007-aea3-4d72-82ad-1112f8b6889c"
        );

        const mailOptions = {
            from: emailUser,
            to: ["mukul85jasdasdasdaha@gm123123aqwil.com"],
            subject: "Testing out the email working" + Math.random() * 200000,
            html: "<div> HELLO WORLD! </div>",
            dsn: {
                id: "some random message specific id",
                return: "headers",
                notify: ["failure", "delay"],
                recipient: emailUser,
            },
        };

        const a = await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log({ error });
                console.log({ info });
            } else {
                console.log("Email sent: " + info.response);
                console.log({ error });
                console.log({ info });
            }
        });
    }

    static interpolateEmailVariables(body, params, emailConfig) {
        const {
            name,
            email,
            treatmentName,
            treatmentNameWithDescription,
            date,
            startTime,
            uniqueId,
            bookingId,
            storeId,
            storeName,
            bookingNumber,
            rooms = [],
            cancellation,
            loggedUser,
        } = params;

        if (cancellation === "rebook") {
            body = body.replace(
                /Cancellation of Appointment/g,
                "Your original appointment has been canceled. Please stay alert for the new Email confirmation"
            );
            body = body.replace(
                /We would like to confirm that the following Appointment has been cancelled/g,
                "Your original appointment has been canceled. Please stay alert for the new Email confirmation."
            );
        }
        let additionalDiv = ``;
        if (
            cancellation === "noshow" ||
            cancellation === "cancellation" ||
            cancellation === "error" ||
            cancellation === "rebook"
        ) {
            additionalDiv = `

    Cancelled By ${loggedUser?.name}<br/>.</p>
`;
        }

        let html = `
            <div style="background-color: ghostwhite; padding: 50px; border-radius: 20px">      
                <table style="width: 150px; max-width:150px; margin: 0 auto">
                    <tr>
                      <td>
                         <img src='%StoreLogoLink%' style="max-height: 150px; max-width: 150px; margin: 0 auto; display: block;" alt="Spa Durban Logo Image" width="150px" height="150px">
                      </td>
                    </tr>
                  </table>
                <br>
                <p style="font-size: 25px; text-align: center;">%BranchName%</p>
                <br>
                <br>
                <div>${body} ${additionalDiv}</div>
            </div>
        `;
        html = html.replace(/%ClientName%/g, name);
        html = html.replace(/%Email%/g, email);
        html = html.replace(/%PackageName%/g, treatmentName);
        html = html.replace(
            /%PackageNameWithDescription%/g,
            this.getFormattedTreatmentWithDescription(treatmentNameWithDescription)
        );
        html = html.replace(/%Date%/g, `${this.getDateString(date)}`);
        html = html.replace(/%Time%/g, `${startTime}`);
        html = html.replace(/%StoreName%/g, storeName);
        html = html.replace(/%Rooms%/g, rooms.map((r) => r.name).join(", "));
        html = html.replace(/%AddOns%/g, emailConfig.addOns);
        html = html.replace(/%BookingNumber%/g, bookingNumber);
        html = html.replace(/%BranchName%/g, emailConfig.branchName);
        html = html.replace(/%StoreBranchName%/g, emailConfig.storeBranchName);
        html = html.replace(/%StoreHotelName%/g, emailConfig.storeHotelName);
        html = html.replace(/%DepositAmount%/g, emailConfig.depositAmount);
        html = html.replace(/%VoucherNotes%/g, emailConfig.voucherNotes || "");
        html = html.replace(/%HotelEmail%/g, emailConfig.emailUser);
        html = html.replace(/%PaymentProof%/g, emailConfig.paymentProof);
        html = html.replace(/%StoreWebLink%/g, emailConfig.storeWebLink);
        html = html.replace(/%BankingDetails%/g, emailConfig.bankingDetails);
        html = html.replace(/%StoreLogoLink%/g, emailConfig.storeLogoLink);
        html = html.replace(
            /%spaConsultCardLink%/g,
            `${STATIC_FRONTEND_BASE_URL}consult-form?store=${emailConfig.storeSlug}&uniqueid=${uniqueId}&email=${email}`
        );
        html = html.replace(
            /%spinTheWheelLink%/g,
            `${SPIN_THE_WHEEL_BASE_URL}?bookingId=${bookingId}`
        );
        html = html.replace(
            /%PaymentForHotelServices%/g,
            emailConfig.paymentForHotelServices
        );
        html = html.replace(/%FAndBMenuType%/g, emailConfig.fAndBMenuType);
        html = html.replace(
            /%RegardsAndContacts%/g,
            emailConfig.regardsAndContacts
        );
        html = html.replace(/%SmsNumber%/g, emailConfig.smsNumber);
        html = html.replace(/%CallNumber%/g, emailConfig.callNumber);
        html = html.replace(/%MapAndAddress%/g, emailConfig.mapAndAddress);
        html = html.replace(
            /%WhatsappButton%/g,
            `
        <br>
        <div>
            <a style="display: flex; text-decoration: none; color: #42cba5; align-items: center!important; font-weight: bold; border: 2px solid; border-radius: 21px; width: fit-content; padding: 3px 12px;" href="${emailConfig.whatsappLink}">
                <img style="object-fit: scale-down; height: 24px; width: 24px;" src="https://bwsserver.com/whatsapp.jpg" alt="wa"/> &nbsp; Whatsapp us
            </a>
        </div>
        <br>`
        );
        html = html.replace(/%SmsNumber%/g, emailConfig.storetiming);
        return html;
    }
    static async transportEmailRebook({
        storeId,
        email,
        emailCCList,
        emailBCCList,
        html,
        subject,
        attachments = [],
    }) {
        const { emailUser, transporter } = UtilsService.getStoreConfig(storeId);
        const mailOptions = {
            from: emailUser,
            to: "headoffice@spadurban.co.za",
            // cc: emailCCList
            //   ? emailCCList.map((v) => (v === "%HotelEmail%" ? emailUser : v))
            //   : [],
            // bcc: emailBCCList
            //   ? emailBCCList.map((v) => (v === "%HotelEmail%" ? emailUser : v))
            //   : [],
            subject,
            html,
            attachments,
        };

        await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log({ error });
                console.log({ info });
            } else {
                console.log(`Email sent successfully to ${email} from ${emailUser}`);
            }
        });
    }
    static async transportEmail({
        storeId,
        email,
        emailCCList,
        emailBCCList,
        html,
        subject,
        attachments = [],
    }) {
        try {
            const { emailUser, transporter } = UtilsService.getStoreConfig(storeId);

            const mailOptions = {
                from: emailUser,
                to: email,
                cc: emailCCList
                    ? emailCCList.map((v) => (v === "%HotelEmail%" ? emailUser : v))
                    : [],
                bcc: emailBCCList
                    ? emailBCCList.map((v) => (v === "%HotelEmail%" ? emailUser : v))
                    : [],
                subject,
                html,
                attachments,
            };

            console.log(mailOptions, "MAIL OPTIONS");

            // Wrap with Promise to capture result and log properly
            // const info = await new Promise((resolve, reject) => {
            //   transporter.sendMail(mailOptions, (error, info) => {
            //     if (error) {
            //       console.error("❌ Email sending failed:", error);
            //       reject(error);
            //     } else {
            //       console.log("✅ Email sent successfully:", info.response);
            //       resolve(info);
            //     }
            //   });
            // });

            // return info;

            const info = await transporter.sendMail(mailOptions);
            console.log(info);
        } catch (err) {
            console.error("❌ Exception during email sending:", err);
        }
    }


    static async sendBookingConfirmationEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "confirm" } });
        let { subject, body, logo } = et;
        const { email, storeId } = params;
        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);
        subject = `Hooray! Your ${emailConfig.storeName} Booking is Confirmed! `;
        let html = this.interpolateEmailVariables(body, params, emailConfig);

        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject,
            attachments: emailConfig.attachments,
        });
    }

    static async sendBookingUpdationEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "confirm" } });
        const { body } = et;
        const subject = "Your booking has been changed";
        const { email, storeId } = params;
        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);

        let html = this.interpolateEmailVariables(body, params, emailConfig);
        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject,
        });
    }

    static async sendBookingCancellationEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "cancel" } });
        const { subject, body } = et;
        const { email, storeId, cancellation, loggedUser } = params;

        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);

        let html = this.interpolateEmailVariables(body, params, emailConfig);

        // cancellation === "rebook" ? "rebook" : "
        let subjects =
            cancellation === "rebook"
                ? "This booking has been canceled and needs to be rebooked."
                : `Your ${emailConfig.storeName} Booking has been cancelled` || subject;
        if (cancellation === "rebook") {
            this.transportEmailRebook({
                email,
                emailBCCList: et.emailBCCList,
                emailCCList: et.emailCCList,
                storeId,
                html,
                subject: subjects,
            });
        } else {
            this.transportEmail({
                email,
                emailBCCList: et.emailBCCList,
                emailCCList: et.emailCCList,
                storeId,
                html,
                subject: subjects,
            });
        }
    }
    static async sendBookingRebookEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "rebook" } });
        const { subject, body } = et;
        const { email, storeId } = params;

        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);

        let html = this.interpolateEmailVariables(body, params, emailConfig);
        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject,
        });
    }

    static async sendSpinTheWheelEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "confirm" } });
        const { email, storeId } = params;
        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);
        let baseHtml = this.getSpinTheWheelHtml();
        const html = this.interpolateEmailVariables(baseHtml, params, emailConfig);

        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject: "Spa Durban - Spin the wheel!",
        });
    }

    static async sendHealthCardEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "confirm" } });
        const { email, storeId } = params;
        if (!storeId) {
            return;
        }
        const emailConfig = UtilsService.getStoreConfig(storeId);
        let baseHtml = this.getHealthCardEmailHtml(emailConfig);
        const html = this.interpolateEmailVariables(baseHtml, params, emailConfig);

        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject: `${emailConfig.storeName} Consult Card`,
        });
    }

    static async sendGuestFeedbackEmail(params) {
        const et = await EmailTemplate.findOne({ where: { type: "confirm" } });
        const { email, storeId } = params;
        if (!storeId) {
            return;
        }
        const htmlSkeleton = this.getGuestFeedbackEmailHtml({
            email,
            uniqueId: params.uniqueId,
        });

        const emailConfig = UtilsService.getStoreConfig(storeId);

        const html = this.interpolateEmailVariables(
            htmlSkeleton,
            params,
            emailConfig
        );

        this.transportEmail({
            email,
            emailBCCList: et.emailBCCList,
            emailCCList: et.emailCCList,
            storeId,
            html,
            subject:
                "Thank You for visiting Spa Durban: We would love to hear your feedback.",
        });
    }

    static getFormattedTreatmentWithDescription(treatmentData) {
        let result = "";
        if (!treatmentData?.length) {
            return result;
        }
        treatmentData.forEach((t) => {
            result += `
                Treatment: ${t.name} <br/>
                Count: ${t.count} <br/>
                Description: <pre style="display: inline; font-family: inherit; margin: 0;">${t.description || "N/A"
                }</pre>
                <br/>
            `;
        });
        return result;
    }

    static getGuestFeedbackEmailHtml({ email, uniqueId }) {
        return `<div>
                    <div style="text-align: center; font-weight: bold;">
                       <p>Thank you for visiting Spa Durban. We hope you enjoyed your treatments and feel relaxed and rejuvenated.</p>
                       <br>
                       <p>If you have any feedback or suggestions, please do not hesitate to let us know. We strive to provide the best possible experience for our guest and value your inputs.</p>
                       <br>
                       <br>
                       <p style="color: darkgrey;">How was your experience?</p> 
                       <br>
                        <div style="display:flex; justify-content: center;">
                            <a href="${STATIC_FRONTEND_BASE_URL}feedback-form?uniqueid=${uniqueId}&email=${email}&feedback=happy">
                                <img src='https://bwsserver.com/smile-face.png' style="max-height: 60px; max-width: 60px; margin: 0 auto; display: block;" alt="Smile Face Image" width="60px" height="60px">                          
                            </a>
                            <a href="${STATIC_FRONTEND_BASE_URL}feedback-form?uniqueid=${uniqueId}&email=${email}&feedback=sad">
                                <img src='https://bwsserver.com/sad-face.png' style="max-height: 60px; max-width: 60px; margin: 0 auto; display: block;" alt="Sad Face Image" width="60px" height="60px">                          
                            </a>
                        </div>
                       <br>
                       <br>
                       <p>Dont miss out on spa Rewards! Register and become a member today:</p>
                       <br>
                       <a href="https://spadurban.co.za/account/register" target="_blank">https://spadurban.co.za/account/register</a>
                       <br>
                       <br>
                       </div>
                       <div>
                           %RegardsAndContacts%
                           %MapAndAddress%
                       </div>
                       
                </div>
            </div>`;
    }

    static getHealthCardEmailHtml(emailConfig) {
        return `
                <div>
                       <p>Welcome to ${emailConfig.storeName}! </p>
                       <br>
                       <p>Your booking reference number is %BookingNumber%</p>
                       <br>
                       <p>We are delighted to have you with us, and we hope that you have a blissful experience.</p> 
                       <p>Before the pampering begins, we need to get to know you. We need to be informed about any medical conditions, allergies, etc – so that we can be comfortable providing you with our services. </p>
                       <br>
                       <p>The link to your ${emailConfig.storeName} Consult Card is provided below. Please fill it in, read through our indemnity information and tick the consent box.</p>
                       <br>
                       <a href="%spaConsultCardLink%" target="_blank">${emailConfig.storeName} Consult Card Form Link</a>
                       <br>
                       <p>Kindly note that having treatments without completing a client card means you agreed to our indemnity, terms, conditions and are in good health.</p>
                       <br>
                       <p>Once it is filled in, the spoils can begin! </p>
                       <br>
                       <div>
                           %RegardsAndContacts%
                           %MapAndAddress%
                       </div>
                </div>
            </div>`;
    }

    static getSpinTheWheelHtml() {
        return `<div>
                        <h2>Hi %ClientName%</h2>
                        <h3>It is your lucky day – Welcome to 'Spa Durban – Spin the Wheel'</h3>
                        <br>
                        <p>You can add a free treatment to your booking (%BookingNumber%) by spinning the wheel!</p>
                        <br>
                        <p>Treatments include; a walnut back scrub, a 15 minute foot massage, a 15 minute head and neck massage and MORE.</p>
                        <br>
                        <p>Click on the link below to win a free treatment, let's see what treat is coming your way.</p>
                        <br>
                        <a href="%spinTheWheelLink%" target="_blank">Spa Durban - Spin the wheel</a>
                        <br>
                        <br>
                        <p><b>Terms and Conditions for Spin the Wheel</b></p>
                        <br>
                        <p>* Valid for this promotion day only - if an appointment is moved the complimentary treatment does not apply anymore. .</p>
                        <p>* Invoiced treatment and the complimentary treatment must be done on the same day. No complimentary treatments will be carried over to another visit.</p>
                        <p>* Only valid when paying cash, card or EFT.</p>
                        <p>* Spin the Wheel does not apply to voucher bookings.</p>
                        <p>* Valid when booking Spa Packages only - excludes waxing.</p>
                        <p>* Excludes Holidays and Peak Seasons.</p>
                        <p>* Please note that this does not apply to daily or weekly specials which are already discounted or have Free add-ons.</p>
                </div>
            </div>`;
    }
}

module.exports = EmailService;
