export class EmailValidator {
	validateEmailContent(subject, body) {

        const dashRegex=/[\u2014\u2013-]/g;
        const violations = [];

        if(dashRegex.test(subject)){
            violations.push({
                type: "Email Subject",
                text: subject
            });
        }

        dashRegex.lastIndex = 0; // Reset regex state for body check

        if(dashRegex.test(body)){
            violations.push({
                type: "Email Body",
                text: body
            });
        }

        return violations;
    
	}

}