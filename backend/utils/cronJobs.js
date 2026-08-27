const cron = require('node-cron');
const Post = require('../models/Post');
const User = require('../models/User');
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Setup email transporter for notifications
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('⏳ Background Cron Worker initialized. Listening for scheduled posts...');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const duePosts = await Post.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).populate('user');

    if (duePosts.length === 0) return;

    console.log(`🚀 Found ${duePosts.length} scheduled post(s) ready to deploy!`);

    for (const post of duePosts) {
      const user = post.user;
      let success = false;
      let errorMsg = null;

      try {

        if (post.platform === 'twitter') {
          if (!user.twitterTokens || !user.twitterTokens.accessToken) throw new Error('Twitter disconnected');
          
          const userTwitterClient = new TwitterApi(user.twitterTokens.accessToken);
          await userTwitterClient.v2.tweet(post.content || "Media upload initiated via Postifye.");
          success = true;
        }

        if (post.platform === 'linkedin') {
          if (!user.linkedinTokens || !user.linkedinTokens.accessToken || !user.linkedinId) throw new Error('LinkedIn disconnected');

          let linkedinPostData = {
            author: `urn:li:person:${user.linkedinId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: post.content || "" },
                shareMediaCategory: "NONE"
              }
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
          };

          if (post.media) {
            const mimeType = post.media.split(';')[0].split(':')[1];
            const base64Data = post.media.split(',')[1];
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const registerResponse = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: `urn:li:person:${user.linkedinId}`,
                serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
              }
            }, {
              headers: {
                'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            const assetUrn = registerResponse.data.value.asset;

            await axios.put(uploadUrl, imageBuffer, {
              headers: { 'Authorization': `Bearer ${user.linkedinTokens.accessToken}`, 'Content-Type': mimeType }
            });

            linkedinPostData.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
            linkedinPostData.specificContent["com.linkedin.ugc.ShareContent"].media = [
              { status: "READY", description: { text: "Scheduled via Postifye" }, media: assetUrn, title: { text: "Postifye Media" } }
            ];
          }

          await axios.post('https://api.linkedin.com/v2/ugcPosts', linkedinPostData, {
            headers: {
              'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type': 'application/json'
            }
          });

          // Deduct LinkedIn quota since it successfully posted
          await User.findByIdAndUpdate(user._id, {
            $inc: { 'subscription.linkedinPostsThisMonth': 1 }
          });
          
          success = true;
        }

      } catch (err) {
        errorMsg = err.response?.data?.message || err.message || 'API rejected the post.';
        console.error(`❌ Failed to deploy scheduled post ${post._id}:`, errorMsg);
      }

      // Update Database Status
      post.status = success ? 'published' : 'failed';
      post.errorLog = errorMsg;
      await post.save();

      try {
        await transporter.sendMail({
          from: `"Postifye" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: success ? `✅ Scheduled ${post.platform} post is live!` : `❌ Failed to publish ${post.platform} post`,
          html: `
            <div style="background-color: #0A0A0A; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #151515; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
                
                <!-- Header / Logo Area -->
                <tr>
                  <td style="padding: 30px 20px; border-bottom: 1px solid #27272a; text-align: center; background-color: #111111;">
                    <!-- NOTE: Change this URL to a hosted image link (e.g. Imgur) if the logo breaks in Gmail during local development -->
                    <img src="https://ik.imagekit.io/adityabhallacorp/postifye.png?updatedAt=1787593133300/150x40/151515/ffffff?text=POSTIFYE" alt="Postifye Logo" style="height: 28px; width: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #f4f4f5; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
                      ${success ? 'Post Published Successfully' : 'Action Required: Post Failed'}
                    </h2>
                    
                    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 30px; margin-top: 0;">
                      Your post scheduled for <strong>${new Date(post.scheduledFor).toLocaleString()}</strong> on <strong style="text-transform: capitalize; color: #818cf8;">${post.platform}</strong> has been processed.
                    </p>
                    
                    <!-- Status Box -->
                    <div style="background-color: #0A0A0A; border: 1px solid #27272a; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                      <p style="margin: 0; font-size: 22px; font-weight: 500; font-family: monospace; color: ${success ? '#818cf8' : '#f87171'}; letter-spacing: 2px;">
                        ${success ? 'SUCCESS' : 'FAILED'}
                      </p>
                      ${!success ? `<p style="margin: 12px 0 0 0; font-size: 13px; color: #71717a;">${errorMsg}</p>` : ''}
                    </div>

                    <!-- Post Media Preview (If attached) -->
                    ${post.media ? `
                    <div style="margin-bottom: 30px;">
                      <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 8px;">Attached Media:</p>
                      <img src="${post.media}" alt="Post Attachment" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #27272a;" />
                    </div>
                    ` : ''}

                    <p style="color: #71717a; font-size: 13px; margin-bottom: 0;">
                      If you want to review your deployment history, <br/> you can safely check your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #818cf8; text-decoration: none; font-weight: 500;">Dashboard</a>.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; background-color: #0A0A0A; text-align: center; border-top: 1px solid #27272a;">
                    <p style="margin: 0; color: #52525b; font-size: 11px;">
                      &copy; ${new Date().getFullYear()} Postifye. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    }
  } catch (error) {
    console.error('🚨 Cron Job System Error:', error);
  }
});