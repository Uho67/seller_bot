1 . project should have BE on nestjs + admin panel on React + telegram bot which works as a nestjs module
2 . entities : product_posts, category_posts, welcome_post, sale_post, admin, user, mailout, buttons
        product_posts has image, name, description, is_enabled
        category_posts has image (does not required), name, desription + we should have specific categories : 
                                                                a. catalog - contains all other categories, (default name =  "Каталог")
                                                                b. all_products - contains all enabled products (default name =  "Усi фото")
                                                                c. first default categories: king_size (default name =  "Товстi"), slims (default name =  "Слiмс"), demy (default name =  "Демi"), bf (default name =  "БФ")
        welcome_post - first post when user press start command in bot
        sale_post - image, name, description, is_enabled - does not belong to a category
        admin - name, password to access to admin panel
        user - information about user which connected to telegram bot, like : first_name, last_name, user_name, chat_id, is_active, created_at, updated_at
        mailout - post can be send to one user or all users, so mailout is entity to store information like 'chat_id', 'post_id', 'is_sent', 'message_id'
        button : 
              order_button - leads to telegram user , name - shown on button, text to prefill - when user press this kind of button it leads to user and prefilled first message (default name =  "Замовити")
              admin_button - leads to telegram user , name - shown on button (default name =  "Адмiн")
              main_menu_button - render welcome post with all needed buttons , name - shown on button (default name =  "Головне меню")
              channel_button- name - shown on button , leads to telegram channel (default name =  "До каналу")
        
        
        name, can contain link to telegram user, link to channel ... link to render post .. action to processed to main menu, o
3 . examples of usage : 
     a. manager go to admin panel create new produc_post , add image, description,name, togle enable -> press save -> systes ask him to assign at leat one of category from select (all categories except of catalog) -> manager choose king_size and press save -> product is saved. 
     b. manager go to admin panel, create new sale_post 
     c. user go to bot and press start -> user is added to table with chat_id for future messages and the rest of information -> bot renders welcome post with buttons : start line : sale_post's name button if it is enabled , first line [catalog button with 'name'], second line [sale_post button 'name' if sale_post is enabled], forth line [button with link to telegram user, button with a link to channel] -> user block bot -> bot put user to is_active=false
     d.user go to bot and press start -> user is added to table with chat_id for future messages and the rest of information -> bot renders welcome post with buttons : start line : sale_post's name button if it is enabled , first line [catalog button with 'name'], second line [sale_post button 'name' if sale_post is enabled], forth line [button with link to telegram user, button with a link to channel] 
         -> user press button with catalog name, bot renders catalog's image, description if it has, buttons with lines : 
                                                start line : sale_post's name button if it is enabled 
                                                secons line : all_products button 
                                                .... lines with button categorie's name, one per line 
                                                before last line contain : [button with link to telegram user, button with a link to channel]
                                                last line :'back button' - leads to main menu
        -> user press sale_post's name button -> bot renders sale_post image, description, buttons : 
                                                    first line : order
                                                    second line : admin + channel
                                                    third line : main_menu_button - heads to main menu 
        User press king_size , bot renders all product_post's buttons with it's name in 2 columns at the end buttons: admin, back button to category , main_menu_button each per line 
