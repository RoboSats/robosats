# Contributing to docs

In order to translate the docs to your language, there are several steps to be done.

## Preparing the files

In the root folder, go to docs/_pages/docs

Create a folder with your language and copy inside the following folders/files

- /docs/_pages/`contribute`
- /docs/_pages/docs/`00-quick-start`
- /docs/_pages/docs/`01-best-practices`
- /docs/_pages/docs/`02-features`
- /docs/_pages/docs/`03-understand`
- /docs/_pages/`home.md`
- /docs/_pages/`stats.md`

this is how it looks the spanish folder

![spanish expample](/docs/contributeDocsImages/image-1.png "spanish folder")

Then go to `/docs/_includes/` and make a copy of the improve and wip files, adding at the end of them `xxx_{your language}`

![alt text](/docs/contributeDocsImages/image-2.png) ![alt text](/docs/contributeDocsImages/image-3.png)

Go to /docs/_data/ and make a copy of navigation.yml , adding at the end of them `xxx_{your language}`

![alt text](/docs/contributeDocsImages/image.png)

## Start translation

Now go file by file in the folder you created and translate everything
In the beginning of most folders you will find this structure

![alt text](/docs/contributeDocsImages/image-5.png)

Remember to change the title, the permalink and the sidebar title.
This is how it looks once changed, in the permalink, add /{your language}/, and do the same in all links with this structure.

![alt text](/docs/contributeDocsImages/image-6.png)

In order to do this quicker and easier, its better to use a find and replace tool. Here is what it looks in VSCode.
Go to the magnifying glass icon in the left and use this as a sample.

![alt text](/docs/contributeDocsImages/image-9.png)

You can replace all at once, or go one by one

![alt text](/docs/contributeDocsImages/image-11.png)

There will be some files that include at the bottom a include for the improve file or the **wip** file
Use the same tool to change it quick in all files.

![alt text](/docs/contributeDocsImages/image-12.png)

![alt text](/docs/contributeDocsImages/image-13.png)

***

## Menus

### Header Menu
In order to translate the menus, change all the titles and urls in the `/docs/_data/navigation_{your language}.yml` file you copied earlier. Then go to `/docs/_data/convertToJson.js` and change the filename const to your filename

![alt text](/docs/contributeDocsImages/image-15.png)

After that,from the root, run node `node .\docs\_data\converToJson.js`, and a json copy will be generated.

### Sidebar
In the `/docs/_includes/nav_list` file, add 2 lines changing the language, just like in the picture below. (change all ocurrences of **'es'**). Add a {% endif %} at the end.

![alt text](/docs/contributeDocsImages/image-14.png)
