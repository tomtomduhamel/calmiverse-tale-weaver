
# Deployment Checklist

## Pre-Deployment Checks
- [ ] All tests are passing (`npm test`)
- [ ] OpenAI API key is properly set in secrets
- [ ] No TypeScript compilation errors (`npm run build`)
- [ ] Retry logic is properly configured
- [ ] Monitoring is set up and functional

## Deployment Steps
1. Run tests: `npm test`
2. Build project: `npm run build`
3. Deploy to Firebase: `firebase deploy --only functions`
4. Verify deployment in Firebase Console

## Post-Deployment Verification
- [ ] Test story generation with test account
- [ ] Verify metrics are being logged
- [ ] Check error handling with invalid inputs
- [ ] Monitor function execution times
- [ ] Verify retry mechanism

## Monitoring Setup
- Monitor these metrics in Firebase Console:
  - Function execution time
  - Error rates
  - Retry counts
  - Memory usage

## Error Codes
- `UNAUTHENTICATED`: User is not authenticated
- `INVALID_ARGUMENTS`: Missing or invalid parameters
- `CONFIGURATION_ERROR`: Missing API key or configuration
- `NOT_FOUND`: Story document not found
- `UPDATE_FAILED`: Failed to update story status
- `OPENAI_ERROR`: OpenAI API errors (with specific subcodes)

## Alerts
Set up alerts for:
- Function execution time > 30s
- Error rate > 5%
- Memory usage > 80%
- Failed retries > 3

## Rollback Procedure
1. Identify the last working version
2. Run `firebase functions:rollback`
3. Verify system functionality
4. Investigate deployment issues

## Support
For issues, contact the development team through:
- Slack: #story-generation-support
- Email: support@team.com
